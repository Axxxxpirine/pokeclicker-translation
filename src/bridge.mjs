import i18next from 'i18next';
import { flatten } from './catalog.mjs';

// Translate trusted complete source lines before the game substitutes (and escapes)
// the trainer's name. NPC data and save keys remain untouched.
export function installTextBridge(page, translate, enabled) {
  const merger = page.TextMerger;
  if (typeof merger?.mergeText !== 'function') return null;
  const original = merger.mergeText;
  function mergeText(text) {
    return original.call(this, enabled() ? (translate(text) ?? text) : text);
  }
  merger.mergeText = mergeText;
  return { restore() { if (merger.mergeText === mergeText) merger.mergeText = original; } };
}

export function installBridge(page, resources, enabled, {translate = () => undefined, domains = {}} = {}) {
  const native = page.App?.translation;
  if (typeof native?.get !== 'function' || !page.ko?.pureComputed) return null;
  const engine = i18next.createInstance();
  engine.init({ lng: 'fr', fallbackLng: 'en', resources, ns: Object.keys(resources.en),
    initImmediate: false, returnEmptyString: false, nsSeparator: '::',
    interpolation: { nestingPrefix: '[[', nestingSuffix: ']]', escapeValue: false },
  });
  engine.services.formatter.add('pokemon', name => engine.t(name, { ns: 'pokemon' }));
  const available = Object.fromEntries(Object.entries(resources.fr).map(([ns, values]) => [ns, flatten(values)]));
  const original = native.get, cache = new Map();
  const logFields = {location:'locationName', item:'itemName', berry:'berry', flute:'itemName', currency:null, name:null, quest:null, reward:null};
  function logOptions(options) {
    const result = {...options};
    for (const [field, domain] of Object.entries(logFields)) {
      const value = result[field];
      if (typeof value === 'string') result[field] = domains[domain]?.[value] ?? translate(value) ?? value;
    }
    return result;
  }
  function get(key, namespace, options) {
    const fallback = original.call(this, key, namespace, options);
    if (!available[namespace]?.[key]?.trim()) return fallback;
    const cacheKey = JSON.stringify([namespace, key]);
    if (options === undefined && cache.has(cacheKey)) return cache.get(cacheKey);
    const computed = page.ko.pureComputed(() => enabled()
      ? engine.t(key, { ...(namespace === 'logbook' ? logOptions(options) : options), ns: namespace })
      : fallback());
    if (options === undefined) cache.set(cacheKey, computed);
    return computed;
  }
  native.get = get;
  return { restore() { if (native.get === get) native.get = original; } };
}
