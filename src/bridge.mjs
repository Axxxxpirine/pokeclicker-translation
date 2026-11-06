import i18next from 'i18next';
import { flatten } from './catalog.mjs';

export function installBridge(page, resources, enabled) {
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
  function get(key, namespace, options) {
    const fallback = original.call(this, key, namespace, options);
    if (!available[namespace]?.[key]?.trim()) return fallback;
    const cacheKey = JSON.stringify([namespace, key]);
    if (options === undefined && cache.has(cacheKey)) return cache.get(cacheKey);
    const computed = page.ko.pureComputed(() => enabled()
      ? engine.t(key, { ...options, ns: namespace })
      : fallback());
    if (options === undefined) cache.set(cacheKey, computed);
    return computed;
  }
  native.get = get;
  return { restore() { if (native.get === get) native.get = original; } };
}
