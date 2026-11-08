import { JSDOM } from 'jsdom';
import { flatten } from '../src/catalog.mjs';

const variables = text => [...new Set([...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]))].sort().join('|');

// Build-time only. Live elements are never replaced and HTML is never injected by the fallback.
export function extractFragments(resources) {
  const window = new JSDOM('').window, result = { en: {}, fr: {} };
  function parse(html) {
    const template = window.document.createElement('template');
    // Browsers render legacy </br> as a break in a div (Intro.js tooltips).
    // The template fragment parser otherwise drops it and merges both text nodes.
    template.innerHTML = html.replace(/<\/br\s*>/gi, '<br>');
    const texts = [];
    function shape(node) {
      if (node.nodeType === 3) {
        if (!node.nodeValue.trim()) return '';
        texts.push(node.nodeValue);
        return '#';
      }
      return `<${node.nodeName}>${[...node.childNodes].map(shape).join('')}</${node.nodeName}>`;
    }
    return { signature: shape(template.content), texts, unsafe: Boolean(template.content.querySelector('script,style,input,textarea,select')) };
  }
  for (const [ns, data] of Object.entries(resources.en)) {
    const french = flatten(resources.fr[ns]);
    for (const [key, en] of Object.entries(flatten(data))) {
      const fr = french[key];
      if (!fr || !/<[a-z/!]|&(?:\w+|#\d+);/i.test(en)) continue;
      const a = parse(en), b = parse(fr);
      if (a.unsafe || b.unsafe || a.signature !== b.signature) continue;
      // A placeholder moved between nodes invalidates the whole structural alignment.
      if (a.texts.some((value, index) => variables(value) !== variables(b.texts[index]))) continue;
      a.texts.forEach((value, index) => {
        if (value.trim().length < 3 || !b.texts[index].trim()) return;
        const id = `${ns}:${key}:${index}`;
        result.en[id] = value;
        result.fr[id] = b.texts[index];
      });
    }
  }
  window.close();
  return result;
}
