const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { AsyncLocalStorage } = require('node:async_hooks');
const { createSessionRefreshHandler, createSessionLogoutHandler, forgetUserSession } = require('@mairie360/lib-components/next');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const APP = path.join(SRC, 'app');
const FRONT_ORIGIN = 'http://administration.mairie360.test';
// Variables lues par configuredBffUrl (src/lib/bff-proxy.ts), dans l'ordre de priorité.
const BFF_URL_VARIABLES = ['BFF_ADMIN_BASE_URL', 'USER_BFF_URL', 'BFF_USER_API_URL', 'NEXT_PUBLIC_BFF_ADMIN_BASE_URL'];

/**
 * Charge des modules TypeScript (.ts / .tsx) de src/ en CommonJS (transpileModule, sans vérification de types).
 * Contrairement au hook minimal des premiers tests, il résout l'alias `@/*` de tsconfig.json et peut
 * remplacer des dépendances (ex. `react`) le temps du chargement.
 */
function loadTs(relativePaths, { stubs = {} } = {}) {
  const originalLoader = { ts: require.extensions['.ts'], tsx: require.extensions['.tsx'] };
  const originalResolve = Module._resolveFilename;
  const originalLoad = Module._load;
  const compile = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true, inlineSourceMap: true, inlineSources: true, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  }).outputText, filename);
  require.extensions['.ts'] = compile;
  require.extensions['.tsx'] = compile;
  Module._resolveFilename = function resolve(request, ...rest) {
    return originalResolve.call(this, request.startsWith('@/') ? path.join(SRC, request.slice(2)) : request, ...rest);
  };
  Module._load = function load(request, ...rest) {
    return Object.hasOwn(stubs, request) ? stubs[request] : originalLoad.call(this, request, ...rest);
  };
  try {
    return relativePaths.map((relativePath) => require(path.join(ROOT, relativePath)));
  } finally {
    require.extensions['.ts'] = originalLoader.ts;
    if (originalLoader.tsx) require.extensions['.tsx'] = originalLoader.tsx;
    else delete require.extensions['.tsx'];
    Module._resolveFilename = originalResolve;
    Module._load = originalLoad;
  }
}

/** Route handlers de l'App Router (`src/app/**\/route.ts`), le catch-all `[...path]` en dernier. */
function discoverRouteFiles(directory = APP) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return discoverRouteFiles(full);
    return entry.name === 'route.ts' ? [path.relative(ROOT, full)] : [];
  }).sort((a, b) => Number(a.includes('[...')) - Number(b.includes('[...')));
}

function routePattern(file) {
  const segments = path.relative('src/app', path.dirname(file)).split(path.sep).filter(Boolean);
  const catchAll = segments.findIndex((segment) => /^\[\.\.\.[^\]]+\]$/.test(segment));
  return { prefix: `/${(catchAll === -1 ? segments : segments.slice(0, catchAll)).join('/')}`, catchAll: catchAll !== -1 };
}

const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
/** JWT non signé : le front ne vérifie que `exp`, la signature est l'affaire du BFF. */
const jwt = (payload = {}) => `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600, ...payload })}.signature`;

/**
 * Simule le navigateur et le serveur Next.js autour du vrai code du front :
 * - `fetch` relatif (navigateur) → middleware.ts puis route handler de src/app, comme l'App Router ;
 * - `fetch` absolu (serveur) → autorisé uniquement vers le BFF mocké, tout autre hôte est une violation.
 */
class FrontHarness {
  constructor({ bff, ownerBff = bff }) {
    this.bff = bff;
    this.ownerBff = ownerBff;
    this.cookie = jwt();
    this.browserCalls = [];
    this.serverCalls = [];
    this.violations = [];
    this.allowedOrigins = new Set();
    this.ownerOrigin = 'https://login.mairie360.test';
    this.ownerCalls = [];
    this.serverContext = new AsyncLocalStorage();
    this.refreshCookie = undefined;
    const routeFiles = discoverRouteFiles();
    const [middleware, ...modules] = loadTs(['src/middleware.ts', ...routeFiles]);
    this.middleware = middleware;
    this.matcher = new RegExp(`^${middleware.config.matcher[0]}$`);
    this.routes = routeFiles.map((file, index) => ({ file, module: modules[index], ...routePattern(file) }))
      .sort((a, b) => Number(a.catchAll) - Number(b.catchAll) || b.prefix.length - a.prefix.length);
  }

  install() {
    this.originalFetch = global.fetch;
    this.useBffUrl(this.bff.url);
    this.previousFrontEnv = { LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL, ADMINISTRATION_FRONT_URL: process.env.ADMINISTRATION_FRONT_URL };
    process.env.LOGIN_FRONT_URL = this.ownerOrigin;
    process.env.ADMINISTRATION_FRONT_URL = FRONT_ORIGIN;
    const config = { userBffUrl: () => this.ownerBff.url, cookieOptions: () => ({ secure: false }), allowedOrigins: () => [FRONT_ORIGIN] };
    this.ownerHandlers = { '/api/auth/refresh': createSessionRefreshHandler(config), '/api/auth/logout': createSessionLogoutHandler(config) };
    global.fetch = (input, init) => this.fetch(input, init);
    return this;
  }

  uninstall() {
    global.fetch = this.originalFetch;
    BFF_URL_VARIABLES.forEach((name) => delete process.env[name]);
    for (const [name, value] of Object.entries(this.previousFrontEnv)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }

  /** Configure l'URL de l'unique BFF comme en déploiement : une seule variable, les autres absentes. */
  useBffUrl(url, variable = 'BFF_ADMIN_BASE_URL') {
    BFF_URL_VARIABLES.forEach((name) => delete process.env[name]);
    process.env[variable] = url;
  }

  reset() {
    forgetUserSession(this.ownerBff.url, this.refreshCookie);
    this.cookie = jwt();
    this.refreshCookie = undefined;
    this.ownerCalls.length = 0;
    this.ownerOverride = undefined;
    this.browserCalls.length = 0;
    this.serverCalls.length = 0;
    this.violations.length = 0;
    this.allowedOrigins.clear();
    this.useBffUrl(this.bff.url);
  }

  async fetch(input, init = {}) {
    const raw = input instanceof Request ? input.url : String(input);
    if (raw.startsWith('/') && !raw.startsWith('//')) return this.browserFetch(raw, init);
    const url = new URL(raw);
    if (url.origin === FRONT_ORIGIN) return this.browserFetch(`${url.pathname}${url.search}`, init);
    if (url.origin === this.ownerOrigin && this.serverContext.getStore()) {
      const handler = this.ownerHandlers[url.pathname];
      if (!handler) throw new Error('Undeclared Login owner operation');
      this.ownerCalls.push({ url, init });
      return this.ownerOverride ? this.ownerOverride(url, init) : handler(new (require('next/server').NextRequest)(url, init));
    }
    if (url.origin === new URL(this.bff.url).origin || url.origin === new URL(this.ownerBff.url).origin || this.allowedOrigins.has(url.origin)) {
      this.serverCalls.push({ method: init.method ?? 'GET', url });
      return this.originalFetch(input, init);
    }
    this.violations.push(`appel réseau hors BFF : ${init.method ?? 'GET'} ${raw}`);
    throw new TypeError('fetch failed');
  }

  /** Requête émise par le code navigateur : même origine, cookie de session joint automatiquement. */
  async browserFetch(target, init = {}) {
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    const cookies = [this.cookie && `accessToken=${this.cookie}`, this.refreshCookie && `refreshToken=${this.refreshCookie}`].filter(Boolean);
    if (cookies.length) headers.set('cookie', cookies.join('; '));
    if (!headers.has('origin')) headers.set('origin', FRONT_ORIGIN);
    if (!headers.has('sec-fetch-site')) headers.set('sec-fetch-site', 'same-origin');
    this.browserCalls.push({ method, target });
    const response = await this.serverContext.run(true, () => this.dispatch(target, { method, headers, body: init.body, signal: init.signal }));
    for (const cookie of response.headers.getSetCookie()) {
      const [pair, ...attributes] = cookie.split(';');
      const [name, ...values] = pair.split('=');
      const value = attributes.some(item => /^\s*max-age=0\s*$/i.test(item)) ? undefined : values.join('=');
      if (name.trim() === 'accessToken') this.cookie = value;
      if (name.trim() === 'refreshToken') this.refreshCookie = value;
    }
    return response;
  }

  async dispatch(target, { method = 'GET', headers = new Headers(), body, signal } = {}) {
    const { NextRequest } = require('next/server');
    const url = new URL(target, FRONT_ORIGIN);
    const build = (requestHeaders) => new NextRequest(url, { method, headers: requestHeaders, signal, ...(body !== undefined && !['GET', 'HEAD'].includes(method) ? { body } : {}) });

    let requestHeaders = new Headers(headers);
    if (this.matcher.test(url.pathname)) {
      const result = this.middleware.middleware(build(requestHeaders));
      if (result.headers.has('location')) return result;
      // NextResponse.next({ request: { headers } }) : Next.js remplace les en-têtes listés.
      const overridden = result.headers.get('x-middleware-override-headers');
      if (overridden) {
        requestHeaders = new Headers();
        for (const name of overridden.split(',')) requestHeaders.set(name, result.headers.get(`x-middleware-request-${name}`));
      }
    }

    const route = this.routes.find(({ prefix, catchAll }) => (catchAll
      ? url.pathname.startsWith(prefix === '/' ? '/' : `${prefix}/`)
      : url.pathname === prefix));
    if (!route) return new Response(null, { status: 404 });
    const handler = route.module[method];
    if (typeof handler !== 'function') return new Response(null, { status: 405 });
    const segments = url.pathname.slice(route.prefix.length).split('/').filter(Boolean).map(decodeURIComponent);
    return handler(build(requestHeaders), { params: Promise.resolve({ path: segments }) });
  }
}

/** Attend qu'une condition asynchrone devienne vraie (effets React, requêtes en cours). */
async function waitFor(predicate, timeout = 3000) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error('Condition non atteinte avant le délai');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

module.exports = { BFF_URL_VARIABLES, FRONT_ORIGIN, FrontHarness, ROOT, SRC, discoverRouteFiles, jwt, loadTs, waitFor };
