const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const root = process.env.MAIRIE_THEME_ROOT || resolve(__dirname, '..');
const load = createRequire(resolve(root, 'package.json'));
const { JSDOM } = load('jsdom');
const postcss = load('postcss');
const { transform, Features } = load('lightningcss');
const markup = `<body class="mairie-ui"><div class="administration-shell"><main><section class="administration-console min-w-0 space-y-6 text-[#172033]"><div class="bg-white"><span id="user-id" class="text-xs text-[#98a2b3]">Identifiant #1</span></div><h1 id="title" class="text-[32px] font-bold leading-tight text-[#0b1220]">Administration</h1><p id="subtitle" class="mt-1 max-w-3xl text-base leading-6 text-[#475467]">Gérez les comptes et les équipes.</p><section class="administration-panel bg-white"><label><span id="field-label" class="block text-sm font-semibold text-[#344054]">Prénom</span><input></label><button id="search" class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition border-[#d0d5dd] bg-white text-[#344054] hover:bg-[#f8f7f5]">Rechercher</button><table><thead class="bg-[#f8f7f5] text-xs font-semibold uppercase tracking-wide text-[#667085]"><tr><th id="table-heading">Utilisateur</th></tr></thead><tbody><tr><td><div id="user-name" class="font-bold text-[#344054]">Anne Marie</div><div id="email" class="text-[#475467]">anne@mairie.test</div></td><td><span id="role-badge" class="rounded bg-[#f2f1ee] px-1.5 py-0.5 font-mono text-xs text-[#667085]">user</span><span id="unknown-session" class="bg-[#f2f4f7] text-[#475467]">État inconnu</span></td></tr></tbody></table><div class="flex flex-col gap-3 border-t border-[#ebe8e3] pt-4 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between"><span id="pagination-summary">2 utilisateurs · 20 maximum par page</span><div class="flex items-center gap-2"><span id="pagination-page" class="min-w-24 text-center font-semibold text-[#344054]">Page 1 / 1</span></div></div><div id="empty" class="rounded-lg border border-dashed border-[#d8d5cf] bg-[#faf9f7] px-5 py-10 text-center text-sm text-[#667085]">Aucun résultat</div><button id="cancel" class="inline-flex h-10 border-transparent bg-transparent text-[#475467] hover:bg-[#f2f1ee]">Annuler</button><button id="primary" class="border-[#315f5c] bg-[#315f5c] text-white hover:bg-[#274d4a]">Enregistrer</button><button id="white-override" class="bg-[#315f5c] text-[#344054] text-white">Action primaire</button><button id="danger" class="border-[#b42318] bg-[#b42318] text-white hover:bg-[#912018]">Supprimer</button></section></section></main></div></body>`;

async function screen(theme, viewport = 1280) {
  const { compile } = load('tailwindcss');
  const globals = readFileSync(resolve(root, 'src/app/globals.css'), 'utf8');
  const municipalPath = process.env.MAIRIE_THEME_FILE || load.resolve('@mairie360/lib-components/styles.css');
  const municipal = readFileSync(municipalPath, 'utf8');
  const dom = new JSDOM(`<html data-theme="${theme}"><head></head>${markup}</html>`);
  dom.window.document.documentElement.setAttribute('data-qa-municipal', 'true');
  const classes = [...dom.window.document.querySelectorAll('[class]')].flatMap(element => [...element.classList]);
  const style = dom.window.document.createElement('style');
  const compiledGlobals = (await compile(globals, {
    base: resolve(root, 'src/app'),
    loadStylesheet: async (id, base) => {
      const path = id === 'tailwindcss' ? load.resolve('tailwindcss/index.css') : id.startsWith('.') || id.startsWith('/') ? resolve(base, id) : load.resolve(id);
      return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
    },
    loadModule: async id => ({ path: load.resolve(id), base: root, module: (await import(pathToFileURL(load.resolve(id)).href)).default }),
  })).build(classes);
  const compiled = `${municipal}\n${compiledGlobals}`;
  // JSDOM does not apply layered utility priority reliably. Keep the compiler's
  // layer order while exposing the declarations to its CSS cascade.
  const parsed = postcss.parse(transform({ filename: 'projects-contrast.css', code: Buffer.from(compiled), include: Features.Nesting }).code.toString());
  const layers = [];
  parsed.walkAtRules('layer', rule => {
    rule.params.split(',').map(name => name.trim()).filter(Boolean).forEach(name => { if (!layers.includes(name)) layers.push(name); });
  });
  const importantLayers = new WeakMap();
  parsed.walkDecls(declaration => {
    if (!declaration.important || !['background', 'background-color'].includes(declaration.prop)) return;
    let ancestor = declaration.parent; let layer;
    while (ancestor) { if (ancestor.type === 'atrule' && ancestor.name === 'layer') { layer = ancestor.params.trim(); break; } ancestor = ancestor.parent; }
    importantLayers.set(declaration, layer === undefined ? Infinity : layers.indexOf(layer));
  });
  parsed.walkAtRules('layer', rule => rule.replaceWith(...(rule.nodes ?? [])));
  // There is no DaisyUI theme-controller input in this fixture. Its :has rules
  // cannot match; omit them because older JSDOM misparses escaped ! utilities
  // when evaluating those unrelated selectors. Explicit data-theme rules stay.
  parsed.walkRules(rule => {
    // The fixture body is municipal; preserve the :has rule's specificity while
    // avoiding the same older JSDOM escaped-class bug for this known condition.
    rule.selector = rule.selector.replaceAll('html:has(body.mairie-ui)', 'html[data-qa-municipal="true"]');
    const selectors = rule.selectors.filter(selector => !selector.includes('.theme-controller'));
    if (selectors.length) rule.selectors = selectors; else rule.remove();
  });
  // Model a hover-capable pointer explicitly; JSDOM has no native pointer media.
  parsed.walkAtRules('media', rule => {
    if (rule.params === '(hover: hover)') { rule.replaceWith(...(rule.nodes ?? [])); return; }
    const width = /^\(width\s*(>=|>|<=|<)\s*(\d+(?:\.\d+)?)(px|rem)\)$/.exec(rule.params);
    const legacy = /^\((min|max)-width:\s*(\d+(?:\.\d+)?)(px|rem)\)$/.exec(rule.params);
    if (!width && !legacy) return;
    const operator = width ? width[1] : legacy[1] === 'min' ? '>=' : '<=';
    const bound = Number((width || legacy)[2]) * ((width || legacy)[3] === 'rem' ? 16 : 1);
    const matches = operator === '>=' ? viewport >= bound : operator === '>' ? viewport > bound : operator === '<=' ? viewport <= bound : viewport < bound;
    if (matches) rule.replaceWith(...(rule.nodes ?? [])); else rule.remove();
  });
  parsed.walkRules(rule => { rule.selector = rule.selector.replaceAll(':hover', '.qa-hover').replaceAll(':focus-visible', '.qa-focus-visible'); });
  const importantBackgrounds = [];
  parsed.walkDecls(declaration => {
    if (declaration.important && ['background', 'background-color'].includes(declaration.prop)) importantBackgrounds.push({ rule: declaration.parent, rank: importantLayers.get(declaration) });
  });
  style.textContent = parsed.toString();
  dom.window.document.head.append(style);
  const computed = element => { try { return dom.window.getComputedStyle(element); } catch (error) { throw new Error(`${element.id}: ${error.name}: ${error.message}`, { cause: error }); } };
  // JSDOM drops shorthand backgrounds containing var(), unlike browsers.
  // Resolve only the actual active colour tokens before applying its cascade.
  const tokens = computed(dom.window.document.documentElement);
  const resolveTokens = css => css.replace(/var\((--mairie-[\w-]+)\)/g, (match, name) => {
    const value = tokens.getPropertyValue(name).trim();
    return /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value) ? value : match;
  });
  style.textContent = resolveTokens(style.textContent);
  // Important declarations reverse layer order: base beats utilities, and any
  // named layer beats unlayered !important. Flattening without this step gives
  // a false positive for escaped !bg utilities (confirmed in native Chrome).
  // Keep JSDOM's selector specificity/order only within the winning layer.
  const layeredBackground = element => {
    const matches = rule => rule.selectors.some(selector => !/::|:(?:before|after|first-letter|first-line)\b/.test(selector) && element.matches(selector));
    const applicable = importantBackgrounds.filter(candidate => matches(candidate.rule));
    if (!applicable.length) return computed(element).backgroundColor;
    const strongest = Math.min(...applicable.map(candidate => candidate.rank));
    const adjusted = parsed.clone(); let index = 0;
    adjusted.walkDecls(declaration => {
      if (!['background', 'background-color'].includes(declaration.prop)) return;
      // Important declarations also beat all normal declarations, regardless
      // of layer or selector specificity (older JSDOM misses this as well).
      if (!declaration.important) { if (declaration.parent.type === 'rule' && matches(declaration.parent)) declaration.remove(); return; }
      const candidate = importantBackgrounds[index++];
      if (candidate.rank > strongest && matches(declaration.parent)) declaration.remove();
    });
    const previous = style.textContent;
    try { style.textContent = resolveTokens(adjusted.toString()); return computed(element).backgroundColor; }
    finally { style.textContent = previous; }
  };
  const variable = (element, name) => {
    for (let current = element; current; current = current.parentElement) {
      const value = computed(current).getPropertyValue(name).trim();
      if (value) return value;
    }
    return '';
  };
  const colour = (value, element) => {
    for (let pass = 0; pass < 10 && value.includes('var('); ++pass) value = value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (_match, name, fallback) => variable(element, name) || fallback || '');
    if (/^#[\da-f]{3}$/i.test(value)) value = '#' + [...value.slice(1)].map(char => char + char).join('');
    if (/^#[\da-f]{6}$/i.test(value)) return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
    const rgb = /^rgb[a]?\((\d+)[, ]+(\d+)[, ]+(\d+)/.exec(value);
    assert.ok(rgb, `Expected an applied solid colour, received ${value}`);
    return rgb.slice(1, 4).map(Number);
  };
  const background = element => {
    for (let current = element; current; current = current.parentElement) {
      const value = layeredBackground(current);
      if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') return colour(value, current);
    }
    throw new Error('No rendered background');
  };
  const luminance = channels => channels.map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return {
    dom,
    colour: id => colour(computed(dom.window.document.getElementById(id)).color, dom.window.document.getElementById(id)),
    background: id => background(dom.window.document.getElementById(id)),
    contrast(id) {
      const element = dom.window.document.getElementById(id);
      const pair = [luminance(colour(computed(element).color, element)), luminance(background(element))].sort((a, b) => b - a);
      return (pair[0] + 0.05) / (pair[1] + 0.05);
    },
  };
}



for (const id of ['title', 'subtitle', 'field-label', 'search', 'table-heading', 'user-name', 'email', 'role-badge', 'pagination-summary', 'pagination-page', 'empty', 'unknown-session', 'cancel']) {
  test(`dark rendered Administrator ${id} has AA contrast on its opaque surface`, async context => {
    const view = await screen('dark');
    try {
      const ratio = view.contrast(id);
      context.diagnostic(`${id}: text rgb(${view.colour(id)}) on rgb(${view.background(id)}), contrast ${ratio.toFixed(2)}:1`);
      assert.ok(ratio >= 4.5, `${id} contrast ${ratio.toFixed(2)} must reach 4.5`);
    } finally { view.dom.window.close(); }
  });
}
test('Administrator dark preserves coloured primary actions, explicit white text, and pagination inheritance', async () => {
  const view = await screen('dark');
  try {
    assert.deepEqual(view.background('primary'), [49, 95, 92]);
    assert.deepEqual(view.background('danger'), [180, 35, 24]);
    for (const id of ['primary', 'danger', 'white-override']) assert.deepEqual(view.colour(id), [255, 255, 255]);
    assert.equal(view.dom.window.document.getElementById('pagination-summary').className, '');
    // MAIR-608: the summary inherits the charte muted token of the dark theme.
    assert.deepEqual(view.colour('pagination-summary'), [227, 223, 227]);
  } finally { view.dom.window.close(); }
});
test('Administrator light preserves title, labels and badge surfaces with readable metadata', async () => {
  const view = await screen('light');
  try {
    assert.deepEqual(view.colour('title'), [11, 18, 32]);
    assert.deepEqual(view.colour('field-label'), [52, 64, 84]);
    assert.ok(view.contrast('pagination-summary') >= 4.5);
    assert.deepEqual(view.colour('email'), [71, 84, 103]);
    assert.deepEqual(view.background('role-badge'), [242, 241, 238]);
  } finally { view.dom.window.close(); }
});

for (const id of ['user-id','role-badge']) test(`light Administrator ${id} reaches AA on its actual surface`, async () => { const view=await screen('light'); try { assert.ok(view.contrast(id)>=4.5, `${id}: ${view.contrast(id).toFixed(2)}`); } finally { view.dom.window.close(); } });
