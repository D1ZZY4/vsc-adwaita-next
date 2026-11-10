/**
 * A small, strict XML reader for GtkSourceView style schemes.
 *
 * The style scheme format is a tiny XML subset: elements, attributes, text
 * content, comments, processing instructions and self-closing tags. Node's
 * standard library has no XML parser and pulling in a dependency for a
 * 180-line file is not worth the weight, so this module implements just enough
 * of XML 1.0 to read and validate those files. Anything malformed throws,
 * which is what we want from a build step.
 */

export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  children: XmlElement[];
  text: string;
}

interface Cursor {
  input: string;
  pos: number;
}

function fail(message: string, cursor: Cursor): never {
  const line = cursor.input.slice(0, cursor.pos).split('\n').length;
  throw new Error(`${message} (line ${line})`);
}

function skipWhitespace(cursor: Cursor): void {
  while (cursor.pos < cursor.input.length && WHITESPACE.test(cursor.input[cursor.pos] ?? '')) {
    cursor.pos += 1;
  }
}

function parseName(cursor: Cursor): string {
  const start = cursor.pos;
  while (cursor.pos < cursor.input.length && NAME_CHAR.test(cursor.input[cursor.pos] ?? '')) {
    cursor.pos += 1;
  }
  if (cursor.pos === start) {
    fail('Expected an element or attribute name', cursor);
  }
  return cursor.input.slice(start, cursor.pos);
}

function parseAttributeValue(cursor: Cursor): string {
  const quote = cursor.input[cursor.pos];
  if (quote !== '"' && quote !== "'") {
    fail('Expected a quoted attribute value', cursor);
  }
  cursor.pos += 1;
  const start = cursor.pos;
  while (cursor.pos < cursor.input.length && cursor.input[cursor.pos] !== quote) {
    cursor.pos += 1;
  }
  if (cursor.pos >= cursor.input.length) {
    fail('Unterminated attribute value', cursor);
  }
  const value = cursor.input.slice(start, cursor.pos);
  cursor.pos += 1;
  return decodeEntities(value);
}

const WHITESPACE = /\s/;
const NAME_CHAR = /[^\s/>=?]/;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    }
    if (body.startsWith('#')) {
      return String.fromCodePoint(parseInt(body.slice(1), 10));
    }
    const replacement = ENTITIES[body];
    if (replacement === undefined) {
      throw new Error(`Unknown XML entity: &${body};`);
    }
    return replacement;
  });
}

function skipProlog(cursor: Cursor): void {
  if (!cursor.input.startsWith('<?xml', cursor.pos)) {
    return;
  }
  const end = cursor.input.indexOf('?>', cursor.pos);
  if (end === -1) {
    fail('Unterminated XML declaration', cursor);
  }
  cursor.pos = end + 2;
  skipWhitespace(cursor);

  while (cursor.input.startsWith('<!--', cursor.pos)) {
    const end = cursor.input.indexOf('-->', cursor.pos + 4);
    if (end === -1) {
      fail('Unterminated comment', cursor);
    }
    cursor.pos = end + 3;
    skipWhitespace(cursor);
  }
}

function parseElement(cursor: Cursor): XmlElement {
  skipWhitespace(cursor);

  while (cursor.input.startsWith('<!--', cursor.pos)) {
    const end = cursor.input.indexOf('-->', cursor.pos + 4);
    if (end === -1) {
      fail('Unterminated comment', cursor);
    }
    cursor.pos = end + 3;
    skipWhitespace(cursor);
  }

  if (cursor.input[cursor.pos] !== '<') {
    fail('Expected "<" to start an element', cursor);
  }
  cursor.pos += 1;

  const name = parseName(cursor);
  const attributes: Record<string, string> = {};

  for (;;) {
    skipWhitespace(cursor);
    const char = cursor.input[cursor.pos];
    if (char === '/' || char === '>') {
      break;
    }
    const attributeName = parseName(cursor);
    skipWhitespace(cursor);
    if (cursor.input[cursor.pos] !== '=') {
      fail(`Expected "=" after attribute "${attributeName}"`, cursor);
    }
    cursor.pos += 1;
    skipWhitespace(cursor);
    if (Object.hasOwn(attributes, attributeName)) {
      fail(`Duplicate attribute "${attributeName}" on <${name}>`, cursor);
    }
    attributes[attributeName] = parseAttributeValue(cursor);
  }

  const element: XmlElement = { name, attributes, children: [], text: '' };

  if (cursor.input[cursor.pos] === '/') {
    cursor.pos += 1;
    if (cursor.input[cursor.pos] !== '>') {
      fail('Expected ">" to close a self-closing tag', cursor);
    }
    cursor.pos += 1;
    return element;
  }

  cursor.pos += 1; // consume ">"

  let text = '';
  for (;;) {
    if (cursor.pos >= cursor.input.length) {
      fail(`Unterminated element <${name}>`, cursor);
    }
    if (cursor.input.startsWith('<!--', cursor.pos)) {
      const end = cursor.input.indexOf('-->', cursor.pos + 4);
      if (end === -1) {
        fail('Unterminated comment', cursor);
      }
      cursor.pos = end + 3;
      continue;
    }
    if (cursor.input.startsWith('</', cursor.pos)) {
      cursor.pos += 2;
      const closingName = parseName(cursor);
      skipWhitespace(cursor);
      if (cursor.input[cursor.pos] !== '>') {
        fail('Expected ">" to close an end tag', cursor);
      }
      cursor.pos += 1;
      if (closingName !== name) {
        fail(`Mismatched end tag </${closingName}> for <${name}>`, cursor);
      }
      element.text = decodeEntities(text.trim());
      return element;
    }
    if (cursor.input[cursor.pos] === '<') {
      element.children.push(parseElement(cursor));
      continue;
    }
    text += cursor.input[cursor.pos];
    cursor.pos += 1;
  }
}

/** Parse a complete XML document and return its root element. */
export function parseXmlDocument(source: string): XmlElement {
  const cursor: Cursor = { input: source, pos: 0 };
  skipProlog(cursor);
  const root = parseElement(cursor);
  skipWhitespace(cursor);
  if (cursor.pos < cursor.input.length) {
    fail('Unexpected trailing content after the root element', cursor);
  }
  return root;
}
