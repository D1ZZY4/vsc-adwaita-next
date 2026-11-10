/**
 * Typed reader for GtkSourceView `.xml` style schemes.
 *
 * A style scheme declares a palette of named colours and a set of named
 * styles. This module resolves colour references (named or literal, including
 * gtksv's `#rgba(r,g,b,a)` form) into plain `#rrggbbaa` strings and rejects
 * anything it cannot resolve, so a broken upstream file fails the build
 * instead of silently producing a wrong theme.
 */

import { readFile } from 'node:fs/promises';

import { normalizeHex, rgbToHex } from './color.ts';
import { parseXmlDocument } from './gtksourceview.ts';
import type { ThemeVariant } from './adwaita.ts';
export type UnderlineStyle = 'none' | 'single' | 'double' | 'low' | 'error' | 'dotted' | 'dashed';

export interface SchemeStyle {
  foreground?: string;
  background?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: UnderlineStyle;
  strikethrough?: boolean;
}

export interface StyleScheme {
  id: string;
  name: string;
  /** Variant declared by the scheme's own metadata. */
  variant: ThemeVariant;
  /** Opposite variant id, when the scheme declares one. */
  pairedVariantId?: string;
  colors: Record<string, string>;
  styles: Record<string, SchemeStyle>;
}

const UNDERLINE_VALUES: readonly UnderlineStyle[] = [
  'none',
  'single',
  'double',
  'low',
  'error',
  'dotted',
  'dashed',
];

const BOOLEAN_ATTRIBUTES = ['bold', 'italic', 'strikethrough'] as const;

function parseColorReference(value: string, context: string): string {
  const trimmed = value.trim();

  const rgbaMatch = /^#rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(
    trimmed,
  );
  if (rgbaMatch) {
    const parts = rgbaMatch.slice(1).map(Number);
    const [r, g, b, a] = parts;
    if (parts.some((component) => Number.isNaN(component)) || parts.length !== 4) {
      throw new Error(`${context}: malformed #rgba() colour "${value}"`);
    }
    if (r === undefined || g === undefined || b === undefined || a === undefined) {
      throw new Error(`${context}: malformed #rgba() colour "${value}"`);
    }
    return rgbToHex({ r, g, b }, a);
  }

  if (trimmed.startsWith('#')) {
    return normalizeHex(trimmed);
  }

  throw new Error(`${context}: unsupported colour reference "${value}"`);
}

function parseBoolean(value: string | undefined, attribute: string, context: string): boolean {
  if (value === undefined) {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`${context}: ${attribute} must be "true" or "false", got "${value}"`);
}

/** Parse and fully resolve a GtkSourceView style scheme document. */
export function parseStyleScheme(source: string, expectedVariant?: ThemeVariant): StyleScheme {
  const root = parseXmlDocument(source);

  if (root.name !== 'style-scheme') {
    throw new Error(`Expected <style-scheme> root, got <${root.name}>`);
  }

  const id = root.attributes.id;
  const name = root.attributes._name ?? root.attributes.name ?? id;
  if (!id) {
    throw new Error('Style scheme is missing its "id" attribute');
  }

  let variant: ThemeVariant | undefined;
  let pairedVariantId: string | undefined;

  for (const metadata of root.children.filter((child) => child.name === 'metadata')) {
    for (const property of metadata.children.filter((child) => child.name === 'property')) {
      const propertyName = property.attributes.name;
      if (propertyName === 'variant') {
        if (property.text !== 'light' && property.text !== 'dark') {
          throw new Error(`Unknown scheme variant "${property.text}"`);
        }
        variant = property.text;
      } else if (propertyName === 'dark-variant' || propertyName === 'light-variant') {
        pairedVariantId = property.text;
      }
    }
  }

  if (variant === undefined) {
    throw new Error(`Scheme "${id}" does not declare a variant`);
  }
  if (expectedVariant !== undefined && variant !== expectedVariant) {
    throw new Error(
      `Scheme "${id}" declares variant "${variant}" but "${expectedVariant}" was expected`,
    );
  }

  const colors: Record<string, string> = {};
  for (const element of root.children.filter((child) => child.name === 'color')) {
    const colorName = element.attributes.name;
    const colorValue = element.attributes.value;
    if (!colorName || !colorValue) {
      throw new Error('A <color> element is missing "name" or "value"');
    }
    if (Object.hasOwn(colors, colorName)) {
      throw new Error(`Duplicate colour "${colorName}"`);
    }
    colors[colorName] = normalizeHex(colorValue);
  }

  const resolveColor = (reference: string | undefined, context: string): string | undefined => {
    if (reference === undefined || reference === '') {
      return undefined;
    }
    if (reference.startsWith('#')) {
      return parseColorReference(reference, context);
    }
    const resolved = colors[reference];
    if (resolved === undefined) {
      throw new Error(`${context}: unknown colour name "${reference}"`);
    }
    return resolved;
  };

  const styles: Record<string, SchemeStyle> = {};
  for (const element of root.children.filter((child) => child.name === 'style')) {
    const styleName = element.attributes.name;
    if (!styleName) {
      throw new Error('A <style> element is missing its "name" attribute');
    }
    if (Object.hasOwn(styles, styleName)) {
      throw new Error(`Duplicate style "${styleName}"`);
    }
    const context = `style "${styleName}"`;

    // `exactOptionalPropertyTypes` is on, so optional keys are only assigned
    // when the scheme actually declares them.
    const style: SchemeStyle = {};
    const foreground = resolveColor(element.attributes.foreground, context);
    if (foreground !== undefined) style.foreground = foreground;
    const background = resolveColor(element.attributes.background, context);
    if (background !== undefined) style.background = background;

    for (const attribute of BOOLEAN_ATTRIBUTES) {
      const raw = element.attributes[attribute];
      if (raw !== undefined) {
        style[attribute] = parseBoolean(raw, attribute, context);
      }
    }

    const underline = element.attributes.underline;
    if (underline !== undefined) {
      if (!UNDERLINE_VALUES.includes(underline as UnderlineStyle)) {
        throw new Error(`${context}: unsupported underline value "${underline}"`);
      }
      style.underline = underline as UnderlineStyle;
    }

    styles[styleName] = style;
  }

  const schemeName = name ?? id;
  const scheme: StyleScheme = { id, name: schemeName, variant, colors, styles };
  if (pairedVariantId !== undefined) scheme.pairedVariantId = pairedVariantId;
  return scheme;
}

/** Load a style scheme from disk and resolve it. */
export async function loadStyleScheme(
  path: string | URL,
  expectedVariant?: ThemeVariant,
): Promise<StyleScheme> {
  const source = await readFile(path, 'utf8');
  return parseStyleScheme(source, expectedVariant);
}
