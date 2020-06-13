// Adapted from UnDOM (minimal DOM) and Domino (spec compliant DOM)
// They're amazing projects

const NODE_TYPES = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12,
};

const voidElements = new Set([
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'embed', 'frame', 'hr',
  'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

function toLower(str) {
  return String(str).toLowerCase();
}

function splice(arr, item, add, byValue) {
  let i = arr ? findWhere(arr, item, true, byValue) : -1;
  if (~i) add ? arr.splice(i, 0, add) : arr.splice(i, 1);
  return i;
}

function findWhere(arr, fn, returnIndex, byValue) {
  let i = arr.length;
  while (i--) if (byValue ? arr[i] === fn : fn(arr[i])) break;
  return returnIndex ? i : arr[i];
}

function createAttributeFilter(ns, name) {
  return o => o.ns === ns && toLower(o.name) === toLower(name);
}

function serialize(el) {
  if (!el)
    return '';
  switch (el.nodeType) {
    case NODE_TYPES.TEXT_NODE: {
      return encodeTextSafe(el.textContent);
    }
    case NODE_TYPES.ELEMENT_NODE: {
      const tag = el.nodeName.toLowerCase();
      const attrs = el.attributes.map(encodeAttribute).join('');
      return voidElements.has(tag)
        ? `<${tag}${attrs}/>`
        : `<${tag}${attrs}>${el.childNodes.map(serialize).join('')}</${tag}>`;
    }

    case NODE_TYPES.DOCUMENT_FRAGMENT_NODE: {
      return `[Fragment]${el.childNodes.map(serialize).join('')}[/Fragment]`;
    }

    // Not going to support NODE_TYPES.DOCUMENT_NODE for <!DOCTYPE...>
    // Just inline the body into an HTML file. Safer.
    default: {
      console.log(el);
      throw new Error(`No serializer for NODE_TYPES "${el.nodeType}"`);
    }
  }
}
const encodeAttribute = a => ` ${a.name}="${encodeTextSafe(a.value)}"`;
const encodeTextSafe = s => s.replace(/[&'"<>]/g, a => `&#${a};`);

class Node {
  constructor(nodeType, nodeName) {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.childNodes = [];
    // This isn't in the spec but I use it a bit. This implementation is wrong
    this.dataset = {};
  }
  get nextSibling() {
    let p = this.parentNode;
    if (p) return p.childNodes[findWhere(p.childNodes, this, true, true) + 1];
    return null;
  }
  get previousSibling() {
    let p = this.parentNode;
    if (p) return p.childNodes[findWhere(p.childNodes, this, true, true) - 1];
    return null;
  }
  get firstChild() {
    return this.childNodes[0];
  }
  get lastChild() {
    return this.childNodes[this.childNodes.length - 1];
  }
  get parentElement() {
    return this.parentNode;
  }
  hasChildNodes() {
    return this.childNodes.length > 0;
  }
  appendChild(child) {
    this.insertBefore(child);
    return child;
  }
  insertBefore(child, ref) {
    child.remove();
    child.parentNode = this;
    if (ref) splice(this.childNodes, ref, child, true);
    else this.childNodes.push(child);
    return child;
  }
  replaceChild(child, ref) {
    if (ref.parentNode === this) {
      this.insertBefore(child, ref);
      ref.remove();
      return ref;
    }
  }
  removeChild(child) {
    splice(this.childNodes, child, false, true);
    return child;
  }
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }
}

class Text extends Node {
  constructor(text) {
    super(NODE_TYPES.TEXT_NODE, '#text');
    this.nodeValue = text;
  }
  set textContent(text) {
    this.nodeValue = text;
  }
  get textContent() {
    return this.nodeValue;
  }
}

class Element extends Node {
  constructor(nodeType, nodeName) {
    super(nodeType || NODE_TYPES.ELEMENT_NODE, nodeName);
    this.attributes = [];
    this.__handlers = {};
    this.style = {};
  }

  get tagName() { return this.nodeName; }

  get className() { return this.getAttribute('class'); }
  set className(val) { this.setAttribute('class', val); }

  get cssText() { return this.getAttribute('style'); }
  set cssText(val) { this.setAttribute('style', val); }

  get children() {
    return this.childNodes.filter(node =>
      node.nodeType === NODE_TYPES.ELEMENT_NODE);
  }

  setAttribute(key, value) {
    this.setAttributeNS(null, key, value);
  }
  getAttribute(key) {
    return this.getAttributeNS(null, key);
  }
  removeAttribute(key) {
    this.removeAttributeNS(null, key);
  }

  setAttributeNS(ns, name, value) {
    let attr = findWhere(this.attributes, createAttributeFilter(ns, name), false, false);
    if (!attr) this.attributes.push(attr = { ns, name });
    attr.value = String(value);
  }
  getAttributeNS(ns, name) {
    let attr = findWhere(this.attributes, createAttributeFilter(ns, name), false, false);
    return attr && attr.value;
  }
  removeAttributeNS(ns, name) {
    splice(this.attributes, createAttributeFilter(ns, name), false, false);
  }

  addEventListener(type, handler) {
    (this.__handlers[toLower(type)] || (this.__handlers[toLower(type)] = [])).push(handler);
  }
  removeEventListener(type, handler) {
    splice(this.__handlers[toLower(type)], handler, false, true);
  }
  dispatchEvent(event) {
    let t = event.target = this,
      c = event.cancelable,
      l, i;
    do {
      event.currentTarget = t;
      l = t.__handlers && t.__handlers[toLower(event.type)];
      if (l) for (i = l.length; i--;) {
        if ((l[i].call(t, event) === false || event._end) && c) {
          event.defaultPrevented = true;
        }
      }
    } while (event.bubbles && !(c && event._stop) && (t = t.parentNode));
    return Boolean(l);
  }

  get innerHTML() {
    return serialize(this);
  }
  set innerHTML(html) {
    throw 'Node.prototype.innerHTML not implemented';
  }
}

class DocumentFragment extends Node {
  constructor() {
    super(NODE_TYPES.DOCUMENT_FRAGMENT_NODE, '#document-fragment');
  }
}

class Document extends Element {
  constructor() {
    super(NODE_TYPES.DOCUMENT_NODE, '#document');
  }

  createElement(type) {
    return new Element(null, String(type).toUpperCase());
  }

  createElementNS(ns, type) {
    let element = this.createElement(type);
    element.namespace = ns;
    return element;
  }


  createTextNode(text) {
    return new Text(text);
  }

  createDocumentFragment() {
    return new DocumentFragment();
  }
}

class Event {
  constructor(type, opts) {
    this.type = type;
    this.bubbles = Boolean(opts && opts.bubbles);
    this.cancelable = Boolean(opts && opts.cancelable);
  }
  stopPropagation() {
    this._stop = true;
  }
  stopImmediatePropagation() {
    this._end = this._stop = true;
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
}

// -----------------------------------------------------------------------------

const window = {
  Document,
  DocumentFragment,
  Node,
  Text,
  Element,
  SVGElement: Element,
  Event,
};
const document = new Document();

window.document = document;
document.defaultView = window;

for (const key in window) {
  // Allows statements like "if (el instanceof Node)" as Node is a global
  global[key] = window[key];
  document[key] = window[key];
}
// There's a convention to detect SSR when "window" isn't set, so don't set it
global.document = document;

document.documentElement = document.createElement('html');
document.head = document.createElement('head');
document.body = document.createElement('body');

document.appendChild(document.documentElement);
document.documentElement.appendChild(document.head);
document.documentElement.appendChild(document.body);

// Entrypoint
const handleError = error => console.error(error);
(async () => {
  await import('../serve/index.js').catch(handleError);
  console.log(document.body.innerHTML);
})().catch(handleError);
