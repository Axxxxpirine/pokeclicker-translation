export function flatten(value, prefix = '', result = {}) {
  for (const [key, child] of Object.entries(value ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') result[path] = child;
    else if (child && typeof child === 'object') flatten(child, path, result);
  }
  return result;
}

const normalize = text => text.replace(/\s+/gu, ' ').trim();
const variables = text => [...new Set([...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]))].sort();
const markup = /<[^>]+>|&(?:[a-z]+|#\d+|#x[0-9a-f]+);/i;

export function buildCatalog(resources) {
  const flat = Object.fromEntries(Object.entries(resources).map(([lang, namespaces]) => [lang,
    Object.fromEntries(Object.entries(namespaces).map(([ns, data]) => [ns, flatten(data)])),
  ]));
  const entries = [], invalid = [], skipped = [], ambiguous = [];
  const candidates = new Map();
  const resolve = (text, lang, namespace, depth = 0) => depth > 5 ? text : text.replace(/\[\[(?:([^:\]]+)::)?([^\]]+)\]\]/g, (all, ns, key) => {
    ns ??= namespace;
    const value = flat[lang]?.[ns]?.[key] || flat.en?.[ns]?.[key];
    return value ? resolve(value, lang, ns, depth + 1) : all;
  });
  for (const [ns, english] of Object.entries(flat.en ?? {})) {
    for (const [key, en] of Object.entries(english)) {
      const fr = flat.fr?.[ns]?.[key];
      const id = `${ns}:${key}`;
      if (!fr?.trim()) continue;
      const source = normalize(resolve(en, 'en', ns)), target = normalize(resolve(fr, 'fr', ns));
      if (JSON.stringify(variables(source)) !== JSON.stringify(variables(target))) { invalid.push(id); continue; }
      if (markup.test(source) || markup.test(target) || /\[\[|\$[a-z]+\$/i.test(source + target)) { skipped.push(id); continue; }
      if (!source || source === target) continue;
      const candidate = { id, en: source, fr: target };
      if (!candidates.has(source)) candidates.set(source, []);
      candidates.get(source).push(candidate);
    }
  }
  const translatedTargets = new Set([...candidates.values()].flatMap(group => group.map(entry => entry.fr)));
  for (const [source, group] of candidates) {
    if (translatedTargets.has(source)) { ambiguous.push({ en: source, keys: group.map(entry => entry.id), reason: 'already-translated-target' }); continue; }
    if (new Set(group.map(entry => entry.fr)).size !== 1) { ambiguous.push({ en: source, keys: group.map(entry => entry.id) }); continue; }
    entries.push(group[0]);
  }
  return { entries, invalid, skipped, ambiguous };
}

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function createTranslator(catalog) {
  const exact = new Map(), templates = [], cache = new Map();
  const domains = Object.fromEntries(Object.entries(catalog.domains ?? {}).map(([name, values]) => [name, new Map(Object.entries(values))]));
  for (const entry of catalog.entries) {
    const tokens = [...entry.en.matchAll(/{{\s*([^{}]+?)\s*}}/g)];
    if (!tokens.length) { exact.set(entry.en, entry.fr); continue; }
    // Named values must come from an explicit finite vocabulary. Unknown placeholders stay numeric.
    const hasDomain = tokens.some(token => Object.hasOwn(domains, token[1]));
    if (tokens.some(token => !/^\w+$/.test(token[1])) || entry.en.replace(/{{[^{}]+}}/g, '').length < (hasDomain ? 4 : 10)) continue;
    let pattern = '^', offset = 0;
    const names = [], groups = new Map();
    for (const token of tokens) {
      pattern += escapeRegex(entry.en.slice(offset, token.index));
      if (groups.has(token[1])) pattern += `\\${groups.get(token[1])}`;
      else {
        names.push(token[1]); groups.set(token[1], names.length);
        const domain = Object.hasOwn(domains, token[1]) ? domains[token[1]] : null;
        pattern += domain ? `(${[...domain.keys()].sort((a, b) => b.length - a.length).map(escapeRegex).join('|') || '(?!)'})` : '([+-]?\\d[\\d., \\u00a0\\u202f’\x27]*%?)';
      }
      offset = token.index + token[0].length;
    }
    pattern += escapeRegex(entry.en.slice(offset)) + '$';
    templates.push({ pattern: new RegExp(pattern), names, target: entry.fr, prefix: entry.en.slice(0, tokens[0].index) });
  }
  function translate(text) {
    if (typeof text !== 'string' || text.length > 10000 || !text.trim()) return undefined;
    const source = normalize(text);
    let target = exact.get(source);
    if (target === undefined) {
      if (cache.has(source)) target = cache.get(source);
      else {
        const results = new Set();
        for (const rule of templates) {
          if (!source.startsWith(rule.prefix)) continue;
          const match = rule.pattern.exec(source);
          if (match) {
            const values = Object.fromEntries(rule.names.map((name, index) => [name, Object.hasOwn(domains, name) ? domains[name].get(match[index + 1]) : match[index + 1]]));
            results.add(rule.target.replace(/{{\s*(\w+)\s*}}/g, (_, name) => values[name]));
          }
        }
        if (results.size === 1) target = [...results][0];
        if (cache.size >= 2000) cache.clear();
        cache.set(source, target);
      }
    }
    if (target === undefined) return undefined;
    return text.match(/^\s*/u)[0] + target + text.match(/\s*$/u)[0];
  }
  return { translate, exactCount: exact.size, templateCount: templates.length };
}
