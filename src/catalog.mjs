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

export function buildCatalog(resources, { rich = false, omitStandalonePokemonForms = false } = {}) {
  const flat = Object.fromEntries(Object.entries(resources).map(([lang, namespaces]) => [lang,
    Object.fromEntries(Object.entries(namespaces).map(([ns, data]) => [ns, flatten(data)])),
  ]));
  const entries = [], invalid = [], skipped = [], ambiguous = [];
  const candidates = new Map();
  const resolve = (text, lang, namespace, depth = 0) => depth > 5 ? text : text.replace(/\[\[(?:([^:\]]+)::?)?([^\]]+)\]\]/g, (all, ns, key) => {
    ns ??= namespace;
    const value = flat[lang]?.[ns]?.[key] || flat.en?.[ns]?.[key];
    return value ? resolve(value, lang, ns, depth + 1) : all;
  });
  for (const [ns, english] of Object.entries(flat.en ?? {})) {
    for (const [key, en] of Object.entries(english)) {
      if (omitStandalonePokemonForms && ns === 'pokemon' && key.startsWith('alt.')) continue;
      const fr = flat.fr?.[ns]?.[key];
      const id = `${ns}:${key}`;
      if (!fr?.trim()) continue;
      const source = normalize(resolve(en, 'en', ns)), target = normalize(resolve(fr, 'fr', ns));
      if (JSON.stringify(variables(source)) !== JSON.stringify(variables(target))) { invalid.push(id); continue; }
      if (/\[\[/.test(source + target) || (!rich && (markup.test(source) || markup.test(target) || /\$[a-z]+\$/i.test(source + target)))) { skipped.push(id); continue; }
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

// Finite names are matched directly in a trie. Combining thousands of names in
// multiple regex groups makes browsers spend seconds compiling their cross-product.
function vocabularyTrie(values) {
  const root = { children: new Map(), end: false };
  for (const value of values) {
    let node = root;
    for (let index = 0; index < value.length; index++) {
      const char = value[index];
      if (!node.children.has(char)) node.children.set(char, {children:new Map(), end:false});
      node = node.children.get(char);
    }
    node.end = true;
  }
  return root;
}

export function createTranslator(catalog) {
  const exact = new Map(), templates = [], cache = new Map();
  const contexts = (catalog.contexts ?? []).map(rule => ({...rule,
    translator: rule.en.includes('{{') ? createTranslator({entries:[rule],domains:catalog.domains,formats:catalog.formats}).translate : null,
  }));
  const duration = /^(?:\d{1,8}:\d{2}(?::\d{2})?|\d+[wdhms](?: \d+[wdhms]){0,4}|\d+|∞|Ready|-)/;
  const numeric = /^[+-]?\d[\d., \u00a0\u202f’']*%?/;
  const domains = Object.fromEntries(Object.entries(catalog.domains ?? {}).map(([name, values]) => [name, new Map(Object.entries(values))]));
  const vocabularies = new Map();
  const tries = Object.fromEntries(Object.entries(domains).map(([name, domain]) => {
    const values = [...domain.keys()].sort(), signature = JSON.stringify(values);
    if (!vocabularies.has(signature)) vocabularies.set(signature, vocabularyTrie(values));
    return [name, vocabularies.get(signature)];
  }));
  const hintTranslator = catalog.hints?.length ? createTranslator({entries:catalog.hints, domains:catalog.domains, formats:catalog.formats}) : null;
  function compoundHint(source) {
    if (!hintTranslator) return undefined;
    const body = source.replace(/\.$/, ''), connectors = [...body.matchAll(/ (and|or) /g)];
    if (connectors.length > 32) return undefined;
    let attempts = 0;
    function rest(start) {
      if (++attempts > 256) return undefined;
      const whole = hintTranslator.translate(body.slice(start).replace(/(?<!\d)\.|\.(?!\d)/g, ''));
      if (whole !== undefined) return whole;
      for (let i=connectors.length-1; i>=0; i--) {
        const connector=connectors[i];
        if (connector.index <= start) continue;
        const first=hintTranslator.translate(body.slice(start,connector.index).replace(/(?<!\d)\.|\.(?!\d)/g, ''));
        if (first === undefined) continue;
        const last=rest(connector.index+connector[0].length);
        if (last !== undefined) return first + (connector[1] === 'and' ? ' et ' : ' ou ') + last;
      }
      return undefined;
    }
    const result=rest(0);
    return result === undefined ? undefined : result + (source.endsWith('.') ? '.' : '');
  }
  for (const entry of catalog.entries) {
    const tokens = [...entry.en.matchAll(/{{\s*([^{}]+?)\s*}}/g)];
    if (!tokens.length) { exact.set(entry.en, entry.fr); continue; }
    const hasDomain = tokens.some(token => Object.hasOwn(domains, token[1]));
    if (tokens.some(token => !/^\w+$/.test(token[1])) || entry.en.replace(/{{[^{}]+}}/g, '').length < (hasDomain ? 4 : 3)) continue;
    let offset = 0;
    const parts = tokens.map(token => {
      const part = {literal:entry.en.slice(offset,token.index),name:token[1]};
      offset = token.index + token[0].length;
      return part;
    });
    templates.push({parts, suffix:entry.en.slice(offset), target:entry.fr, prefix:parts[0].literal});
  }
  function matchTemplate(rule, source) {
    const values = Object.create(null);
    let visits = 0;
    function visit(index, position) {
      if (++visits > 512) return false;
      if (index === rule.parts.length) return source.slice(position) === rule.suffix;
      const {literal, name} = rule.parts[index];
      if (!source.startsWith(literal,position)) return false;
      position += literal.length;
      if (Object.hasOwn(values,name)) return source.startsWith(values[name],position) && visit(index+1,position+values[name].length);
      const ends = [];
      if (Object.hasOwn(tries,name)) {
        let node = tries[name];
        for (let end=position; end<source.length; end++) {
          node = node.children.get(source[end]);
          if (!node) break;
          if (node.end) ends.push(end+1);
        }
      } else {
        const pattern = catalog.formats?.[name] === 'duration' ? duration : numeric;
        const match = pattern.exec(source.slice(position, position + 64));
        if (match) {
          for (let length=1; length<=match[0].length; length++) {
            const value=match[0].slice(0,length);
            if (pattern.exec(value)?.[0] === value) ends.push(position+length);
          }
        }
      }
      for (let i=ends.length-1; i>=0; i--) {
        values[name] = source.slice(position,ends[i]);
        if (visit(index+1,ends[i])) return true;
      }
      delete values[name];
      return false;
    }
    return visit(0,0) ? values : null;
  }
  function translate(text, element) {
    if (typeof text !== 'string' || text.length > 10000 || !text.trim()) return undefined;
    const source = normalize(text);
    let contextTarget;
    const context = element?.closest ? contexts.find(rule => {
      const target = rule.en === source ? rule.fr : rule.translator?.(source);
      if (target === undefined) return false;
      let anchor = element.closest(rule.selector);
      if (!anchor && rule.contains) {
        const tooltip = element.closest('.tooltip');
        if (tooltip?.id && /^[\w-]+$/.test(tooltip.id)) anchor = element.ownerDocument.querySelector(`[aria-describedby~="${tooltip.id}"]`)?.closest(rule.selector);
      }
      if (!anchor || (rule.contains && !anchor.matches(rule.contains) && !anchor.querySelector(rule.contains))) return false;
      contextTarget = target;
      return true;
    }) : undefined;
    let target = context ? contextTarget : exact.get(source);
    if (target === undefined) {
      if (cache.has(source)) target = cache.get(source);
      else {
        const results = new Set();
        for (const rule of templates) {
          if (!source.startsWith(rule.prefix) || !source.endsWith(rule.suffix)) continue;
          const match = matchTemplate(rule,source);
          if (match) {
            const values = Object.fromEntries(Object.entries(match).map(([name,value]) => [name, Object.hasOwn(domains,name) ? domains[name].get(value) : catalog.formats?.[name] === 'duration' ? value.replace(/(\d)w/g,'$1 sem.').replace(/(\d)d/g,'$1j').replace(/^Ready$/,'Prêt') : value]));
            results.add(rule.target.replace(/{{\s*(\w+)\s*}}/g, (_, name) => values[name]));
          }
        }
        if (results.size === 1) target = [...results][0];
        else if (results.size === 0) target = compoundHint(source);
        if (cache.size >= 2000) cache.clear();
        cache.set(source, target);
      }
    }
    if (target === undefined) return undefined;
    return text.match(/^\s*/u)[0] + target + text.match(/\s*$/u)[0];
  }
  return { translate, exactCount: exact.size, templateCount: templates.length };
}
