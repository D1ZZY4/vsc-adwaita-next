/**
 * Tests for the GtkSourceView style scheme reader and the scope map.
 */

import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseStyleScheme } from '../src/style-scheme.ts';
import { parseXmlDocument } from '../src/gtksourceview.ts';
import { SCOPE_MAP, SCOPE_MAP_ORDER } from '../src/scopes.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MINIMAL_SCHEME = `<?xml version="1.0" encoding="UTF-8"?>
<style-scheme id="Test" _name="Test Scheme" version="1.0">
  <metadata>
    <property name="variant">light</property>
    <property name="dark-variant">Test-dark</property>
  </metadata>
  <color name="red" value="#FF0000"/>
  <color name="blue" value="#0000FF"/>
  <style name="text" foreground="red"/>
  <style name="def:keyword" foreground="blue" bold="true"/>
  <style name="def:string" foreground="#00FF00" italic="true"/>
  <style name="def:comment" foreground="red" underline="error"/>
  <style name="def:number" background="#rgba(1, 2, 3, 0.5)"/>
</style-scheme>`;

describe('parseXmlDocument', () => {
  it('reads elements, attributes and text', () => {
    const root = parseXmlDocument('<a x="1"><b>hello</b><c/></a>');
    expect(root.name).toBe('a');
    expect(root.attributes.x).toBe('1');
    expect(root.children.map((child) => child.name)).toEqual(['b', 'c']);
    expect(root.children[0]?.text).toBe('hello');
  });

  it('skips comments', () => {
    const root = parseXmlDocument('<a><!-- note --><b/></a>');
    expect(root.children.map((child) => child.name)).toEqual(['b']);
  });

  it('decodes entities', () => {
    const root = parseXmlDocument('<a x="&lt;&amp;&gt;"/>');
    expect(root.attributes.x).toBe('<&>');
  });

  it('rejects malformed documents', () => {
    expect(() => parseXmlDocument('<a><b></a>')).toThrow(/Mismatched end tag/);
    expect(() => parseXmlDocument('<a>')).toThrow(/Unterminated element/);
    expect(() => parseXmlDocument('<a x="1" x="2"/>')).toThrow(/Duplicate attribute/);
    expect(() => parseXmlDocument('<a/><b/>')).toThrow(/trailing content/);
    expect(() => parseXmlDocument('nonsense')).toThrow(/Expected "<"/);
  });
});

describe('parseStyleScheme', () => {
  it('resolves named colour references', () => {
    const scheme = parseStyleScheme(MINIMAL_SCHEME, 'light');
    expect(scheme.colors).toEqual({ red: '#ff0000ff', blue: '#0000ffff' });
    expect(scheme.styles.text?.foreground).toBe('#ff0000ff');
    expect(scheme.styles['def:keyword']?.foreground).toBe('#0000ffff');
  });

  it('reads literal colours and gtksv rgba() form', () => {
    const scheme = parseStyleScheme(MINIMAL_SCHEME, 'light');
    expect(scheme.styles['def:string']?.foreground).toBe('#00ff00ff');
    // 0.5 * 255 rounds to 128
    expect(scheme.styles['def:number']?.background).toBe('#01020380');
  });

  it('reads boolean style attributes', () => {
    const scheme = parseStyleScheme(MINIMAL_SCHEME, 'light');
    expect(scheme.styles['def:keyword']?.bold).toBe(true);
    expect(scheme.styles['def:string']?.italic).toBe(true);
    expect(scheme.styles.text?.bold).toBeUndefined();
  });

  it('reads underline styles', () => {
    const scheme = parseStyleScheme(MINIMAL_SCHEME, 'light');
    expect(scheme.styles['def:comment']?.underline).toBe('error');
  });

  it('reads the declared variant and its pair', () => {
    const scheme = parseStyleScheme(MINIMAL_SCHEME, 'light');
    expect(scheme.variant).toBe('light');
    expect(scheme.pairedVariantId).toBe('Test-dark');
    expect(scheme.name).toBe('Test Scheme');
  });

  it('rejects a scheme whose variant does not match', () => {
    expect(() => parseStyleScheme(MINIMAL_SCHEME, 'dark')).toThrow(/declares variant "light"/);
  });

  it('rejects unknown colour references', () => {
    const broken = MINIMAL_SCHEME.replace('foreground="red"', 'foreground="chartreuse"');
    expect(() => parseStyleScheme(broken, 'light')).toThrow(/unknown colour name/);
  });

  it('rejects a non style-scheme root', () => {
    expect(() => parseStyleScheme('<style-schemes/>', 'light')).toThrow(/Expected <style-scheme>/);
  });
});

describe('vendored schemes', () => {
  it('both variants load and agree on their style names', async () => {
    const light = parseStyleScheme(
      await readFile(join(ROOT, 'src/gtksourceview/adwaita.xml'), 'utf8'),
      'light',
    );
    const dark = parseStyleScheme(
      await readFile(join(ROOT, 'src/gtksourceview/adwaita-dark.xml'), 'utf8'),
      'dark',
    );

    expect(light.variant).toBe('light');
    expect(dark.variant).toBe('dark');
    expect(Object.keys(light.styles).sort()).toEqual(Object.keys(dark.styles).sort());
    expect(Object.keys(light.colors).length).toBeGreaterThan(40);
  });

  it('every style the scope map references exists in both schemes', async () => {
    const light = parseStyleScheme(
      await readFile(join(ROOT, 'src/gtksourceview/adwaita.xml'), 'utf8'),
      'light',
    );
    const dark = parseStyleScheme(
      await readFile(join(ROOT, 'src/gtksourceview/adwaita-dark.xml'), 'utf8'),
      'dark',
    );

    const missing = SCOPE_MAP_ORDER.filter(
      (name) => light.styles[name] === undefined || dark.styles[name] === undefined,
    );
    expect(missing).toEqual([]);
  });

  it('every mapped style has a foreground or a font style', async () => {
    const light = parseStyleScheme(
      await readFile(join(ROOT, 'src/gtksourceview/adwaita.xml'), 'utf8'),
      'light',
    );

    const empty = SCOPE_MAP_ORDER.filter((name) => {
      const style = light.styles[name];
      if (style === undefined) return false;
      const hasColour = style.foreground !== undefined || style.background !== undefined;
      const hasFontStyle =
        style.bold === true ||
        style.italic === true ||
        style.strikethrough === true ||
        style.underline !== undefined;
      return !hasColour && !hasFontStyle;
    });
    // A style with neither colour nor style is dead weight in the theme.
    expect(empty).toEqual([]);
  });
});

describe('scope map', () => {
  it('has no duplicate selectors across styles', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const styleName of SCOPE_MAP_ORDER) {
      for (const selector of SCOPE_MAP[styleName]) {
        if (selector === '') continue;
        const previous = seen.get(selector);
        if (previous !== undefined) {
          duplicates.push(`${selector} (${previous} and ${styleName})`);
        } else {
          seen.set(selector, styleName);
        }
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('only uses non-empty selector strings', () => {
    for (const styleName of SCOPE_MAP_ORDER) {
      for (const selector of SCOPE_MAP[styleName]) {
        expect(typeof selector).toBe('string');
        expect(selector.length).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('covers the languages the project advertises', () => {
    const selectors = new Set<string>();
    for (const styleName of SCOPE_MAP_ORDER) {
      for (const selector of SCOPE_MAP[styleName]) selectors.add(selector);
    }
    const has = (selector: string): boolean => selectors.has(selector);

    // One representative scope per language family we claim to support.
    const expected = [
      'keyword.operator.new', // TypeScript, JavaScript
      'entity.name.tag.jsx', // TSX, JSX
      'entity.name.type.lifetime.rust', // Rust
      'support.function.builtin.python', // Python
      'storage.type.go', // Go
      'source.c storage.type', // C, C++
      'storage.type.primitive.java', // Java
      'storage.type.cs', // C#
      'keyword.control.ruby', // Ruby
      'meta.preprocessor', // PHP, C
      'keyword.type.swift', // Swift
      'entity.name.tag', // HTML, XML, Svelte
      'support.type.property-name.css', // CSS
      'support.type.property-name.json', // JSON, JSONC
      'entity.name.tag.yaml', // YAML
      'keyword.other.DML.sql', // SQL
      'markup.heading.markdown', // Markdown
      'comment.line.number-sign.shebang', // Shell, Bash
      'constant.other.placeholder.go', // Go printf
      'entity.name.type.class.python', // Python
    ];
    const missing = expected.filter((selector) => !has(selector));
    expect(missing).toEqual([]);
  });
});
