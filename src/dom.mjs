const attributes = ['title', 'placeholder', 'aria-label', 'alt', 'data-original-title', 'data-content'];
const excluded = 'script,style,textarea,pre,.trainer-name,[contenteditable]:not([contenteditable="false"]),[data-pct-ignore]';

export function mountTranslation(document, translate) {
  const view = document.defaultView;
  const texts = new Map(), attrs = new Map(), options = new Map(), pending = new Set();
  let enabled = true, timer = null, stopped = false, writes = 0;
  const eligible = element => element && !element.closest(excluded);

  function originalOptionText(option) {
    const walker = document.createTreeWalker(option, view.NodeFilter.SHOW_TEXT);
    let value = '';
    while (walker.nextNode()) {
      const node = walker.currentNode, record = texts.get(node);
      value += record?.translated === node.nodeValue ? record.original : node.nodeValue;
    }
    return value.replace(/[\t\n\f\r ]+/g, ' ').replace(/^ | $/g, '');
  }

  function text(node) {
    if (!eligible(node.parentElement)) return;
    const value = node.nodeValue;
    if (texts.get(node)?.translated === value) return;
    texts.delete(node);
    const option = node.parentElement.tagName === 'OPTION' ? node.parentElement : null;
    if (option && options.has(option)) {
      if (option.getAttribute('value') !== options.get(option)) options.delete(option);
      else {
        // A native text update on a reused implicit option also changes its value.
        const original = originalOptionText(option);
        option.setAttribute('value', original);
        options.set(option, original);
      }
    }
    const translated = translate(value, node.parentElement);
    if (translated !== undefined && translated !== value) {
      if (option && !option.hasAttribute('value')) {
        options.set(option, option.value);
        option.setAttribute('value', option.value);
      }
      texts.set(node, { original: value, translated });
      node.nodeValue = translated; writes++;
    }
  }
  function element(node) {
    if (!eligible(node)) return;
    for (const name of attributes) {
      const value = node.getAttribute(name);
      const record = attrs.get(node);
      if (value === null || record?.get(name)?.translated === value) continue;
      record?.delete(name);
      const translated = translate(value, node);
      if (translated !== undefined && translated !== value) {
        if (!attrs.has(node)) attrs.set(node, new Map());
        attrs.get(node).set(name, { original: value, translated });
        node.setAttribute(name, translated); writes++;
      }
    }
  }
  function scan(root) {
    if (!root.isConnected) return;
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1 || !eligible(root)) return;
    element(root);
    const walker = document.createTreeWalker(root, view.NodeFilter.SHOW_ELEMENT | view.NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeType === 1 && !eligible(node) ? view.NodeFilter.FILTER_REJECT : view.NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === 3) text(walker.currentNode);
      else element(walker.currentNode);
    }
  }
  function flush() {
    timer = null;
    if (!enabled || stopped) { pending.clear(); return; }
    for (const node of pending) scan(node);
    pending.clear();
    for (const node of texts.keys()) if (!node.isConnected) texts.delete(node);
    for (const node of attrs.keys()) if (!node.isConnected) attrs.delete(node);
    for (const node of options.keys()) if (!node.isConnected) options.delete(node);
  }
  function schedule(node) {
    if (!enabled || stopped) return;
    pending.add(node);
    if (timer === null) timer = view.setTimeout(flush, 16);
  }
  const observer = new view.MutationObserver(records => {
    if (!enabled) return;
    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of record.addedNodes) schedule(node);
        // A removals-only batch still releases detached-node records.
        if (record.removedNodes.length && timer === null) timer = view.setTimeout(flush, 16);
      } else if (record.type === 'attributes') {
        if (attrs.get(record.target)?.get(record.attributeName)?.translated !== record.target.getAttribute(record.attributeName)) schedule(record.target);
      } else if (texts.get(record.target)?.translated !== record.target.nodeValue) schedule(record.target);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  scan(document.body);
  function setEnabled(value) {
    enabled = Boolean(value);
    if (enabled) scan(document.body);
    else {
      for (const [node, record] of texts) if (node.nodeValue === record.translated) node.nodeValue = record.original;
      for (const [node, records] of attrs) for (const [name, record] of records) if (node.getAttribute(name) === record.translated) node.setAttribute(name, record.original);
      for (const [node, value] of options) if (node.getAttribute('value') === value) node.removeAttribute('value');
      texts.clear(); attrs.clear(); options.clear(); pending.clear();
    }
  }
  return {
    setEnabled,
    stats: () => ({ enabled, writes, textNodes: texts.size, attributeNodes: attrs.size }),
    stop() { setEnabled(false); stopped = true; observer.disconnect(); if (timer !== null) view.clearTimeout(timer); },
  };
}
