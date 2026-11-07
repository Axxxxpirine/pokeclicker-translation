import { createTranslator } from './catalog.mjs';
import { mountTranslation } from './dom.mjs';
import { installBridge } from './bridge.mjs';
import { catalog, resources, version } from '../.verification/payload.mjs';

const storageKey = 'pokeclicker-translation.enabled';

function start() {
  if (globalThis.PokeClickerTranslation || !document.body) return;
  let active = true;
  try { active = localStorage.getItem(storageKey) !== 'false'; } catch { /* Storage may be blocked. */ }
  const display = mountTranslation(document, createTranslator(catalog).translate);
  display.setEnabled(active);
  const style = document.createElement('style');
  style.id = 'pokeclicker-translation-layout';
  style.textContent = `
    html[data-pct-enabled="true"] #dailyQuestDisplayBody .row > .col-10 {
      flex: 1 1 0; max-width: none; min-width: 0;
    }
    html[data-pct-enabled="true"] #dailyQuestDisplayBody .row > .col-2 {
      flex: 0 0 auto; width: auto; max-width: none; padding-left: .3rem;
    }
    html[data-pct-enabled="true"] #dailyQuestDisplayBody .col-2 .btn {
      width: auto; white-space: nowrap; line-height: 18px; padding: 0 .35rem !important;
    }
  `;
  document.head.append(style);
  let signal = null, bridge = null, attempts = 0;
  const button = document.createElement('button');
  button.id = 'pokeclicker-translation-toggle';
  button.type = 'button';
  button.setAttribute('data-pct-ignore', '');
  button.style.cssText = 'position:fixed;bottom:8px;right:8px;z-index:2000;border:1px solid #5680aa;border-radius:6px;padding:5px 9px;background:#18314b;color:white;font:12px system-ui;cursor:pointer;opacity:.9';
  const updateButton = () => {
    document.documentElement.setAttribute('data-pct-enabled', String(active));
    button.textContent = active ? 'FR ✓' : 'FR —';
    button.setAttribute('aria-pressed', String(active));
    button.title = active ? 'Traduction française (préversion) — désactiver' : 'Traduction française (préversion) — activer';
    button.setAttribute('aria-label', button.title);
  };
  function setEnabled(value) {
    active = Boolean(value);
    signal?.(active);
    display.setEnabled(active);
    updateButton();
    try { localStorage.setItem(storageKey, String(active)); } catch { /* Optional preference only. */ }
  }
  button.addEventListener('click', () => setEnabled(!active));
  updateButton();
  document.body.append(button);

  function connect() {
    // App is a top-level lexical class in the released game, not a window property.
    const app = typeof App !== 'undefined' ? App : globalThis.App;
    if (app?.translation && globalThis.ko?.observable) {
      signal = globalThis.ko.observable(active);
      bridge = installBridge({ App: app, ko: globalThis.ko }, resources, signal);
      return true;
    }
    return false;
  }
  if (!connect()) {
    const timer = setInterval(() => { if (connect() || ++attempts >= 240) clearInterval(timer); }, 250);
  }
  globalThis.PokeClickerTranslation = Object.freeze({
    version, setEnabled,
    get enabled() { return active; },
    stats: () => ({ ...display.stats(), nativeBridge: Boolean(bridge), version }),
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
