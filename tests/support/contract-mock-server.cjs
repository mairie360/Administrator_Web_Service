const http = require('node:http');

// Faux BFF User servi en HTTP réel, piloté par contracts/openapi.json (même principe que
// BFF_user/tests/support/contract-mock-server.ts) : chaque requête reçue du front est vérifiée
// contre le contrat (chemin, méthode, paramètres, query, corps JSON) et chaque réponse mockée est
// validée contre le schéma du statut renvoyé. Les écarts sont collectés dans `violations`.

// Documents servis par le BFF hors contrat et volontairement relayés par src/lib/bff-proxy.ts.
const METADATA_PATHS = ['/openapi.json', '/swagger.json'];

class ContractMockServer {
  constructor(service, contract) {
    this.service = service;
    this.contract = contract;
    this.requests = [];
    this.violations = [];
    this.handlers = new Map();
    this.url = '';
  }

  async start() {
    this.server = http.createServer((req, res) => {
      this.handle(req, res).catch((error) => {
        // Une exception dans le mock ne doit pas tuer node:test : elle devient une violation.
        this.violations.push(`[${this.service}] erreur du mock : ${error instanceof Error ? error.message : String(error)}`);
        send(res, 500, JSON.stringify({ message: 'Erreur du mock' }));
      });
    });
    await new Promise((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    this.url = `http://127.0.0.1:${this.server.address().port}`;
    return this.url;
  }

  async stop() {
    if (!this.server) return;
    this.server.closeAllConnections();
    await new Promise((resolve) => this.server.close(() => resolve()));
    this.server = undefined;
  }

  /** Enregistre une réponse ; le couple méthode/chemin doit exister dans le contrat. */
  on(method, template, handler) {
    if (!this.contract.document.paths[template]?.[method.toLowerCase()]) {
      throw new Error(`${method} ${template} n'est pas déclaré dans le contrat ${this.contract.title}`);
    }
    this.handlers.set(`${method.toUpperCase()} ${template}`, typeof handler === 'function' ? handler : () => handler);
    return this;
  }

  reset() {
    this.requests.length = 0;
    this.violations.length = 0;
    this.handlers.clear();
  }

  calls(template, method) {
    return this.requests.filter((request) => request.template === template && (!method || request.method === method.toUpperCase()));
  }

  async handle(req, res) {
    const method = req.method ?? 'GET';
    const url = new URL(req.url ?? '/', this.url);
    const rawBody = await readBody(req);
    const base = { method, url, path: url.pathname, headers: req.headers, rawBody };

    if (METADATA_PATHS.includes(url.pathname) && (method === 'GET' || method === 'HEAD')) {
      this.requests.push({ ...base, template: url.pathname, pathParams: {}, metadata: true });
      return send(res, 200, method === 'HEAD' ? '' : JSON.stringify(this.contract.document));
    }

    // Express répond à HEAD avec la route GET : le contrat ne déclare donc que GET.
    const contractMethod = method === 'HEAD' ? 'GET' : method;
    const { match, errors, undeclaredQuery } = this.contract.validateRequest(contractMethod, url);
    errors.forEach((error) => this.violations.push(`[${this.service}] requête ${method} ${url.pathname}${url.search} : ${error}`));
    if (!match) return send(res, 404, JSON.stringify({ message: 'Route absente du contrat' }));
    undeclaredQuery.forEach((name) => this.violations.push(`[${this.service}] requête ${method} ${match.template} : paramètre query "${name}" non déclaré`));

    let body;
    const { required, schema: bodySchema } = this.contract.requestBodySchema(match);
    if (rawBody) {
      try { body = JSON.parse(rawBody); } catch { this.violations.push(`[${this.service}] requête ${method} ${match.template} : corps JSON invalide`); }
    } else if (required) {
      this.violations.push(`[${this.service}] requête ${method} ${match.template} : corps requis manquant`);
    }
    if (bodySchema && body !== undefined) {
      this.contract.validate(bodySchema, body, '$body').forEach((error) => this.violations.push(`[${this.service}] requête ${method} ${match.template} ${error}`));
    }

    const request = { ...base, template: match.template, pathParams: match.pathParams, undeclaredQuery, body };
    this.requests.push(request);
    const handler = this.handlers.get(`${contractMethod} ${match.template}`);
    if (!handler) {
      this.violations.push(`[${this.service}] appel non mocké : ${method} ${match.template}`);
      return send(res, 500, JSON.stringify({ message: 'Appel non mocké' }));
    }

    const reply = handler(request);
    if (reply.dropConnection) return void req.socket.destroy();
    const status = reply.status ?? 200;
    if (!reply.outOfContract) {
      const { documented, schema } = this.contract.responseSchema(match, status);
      if (!documented) this.violations.push(`[${this.service}] ${method} ${match.template} : statut ${status} non documenté`);
      if (schema && reply.raw === undefined) {
        this.contract.validate(schema, reply.body).forEach((error) => this.violations.push(`[${this.service}] réponse ${status} ${method} ${match.template} ${error}`));
      }
    }
    const payload = reply.raw ?? (reply.body === undefined ? '' : JSON.stringify(reply.body));
    return send(res, status, method === 'HEAD' ? '' : payload, reply.contentType, reply.headers);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res, status, payload, contentType = 'application/json', headers = {}) {
  if (res.headersSent) return;
  res.writeHead(status, { ...(payload ? { 'Content-Type': contentType } : {}), ...headers });
  res.end(payload);
}

/** Retourne une URL sur laquelle rien n'écoute (port libéré juste après attribution). */
async function unreachableUrl() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(() => resolve()));
  return `http://127.0.0.1:${port}`;
}

module.exports = { ContractMockServer, METADATA_PATHS, unreachableUrl };
