/**
 * Build TextMate and semantic token colours from a GtkSourceView scheme.
 *
 * The result is what VS Code consumes: a `tokenColors` array of scope to
 * settings rules plus a `semanticTokenColors` map for language servers. Both
 * are derived from the same Adwaita style definitions so that TextMate and
 * semantic highlighting cannot drift apart.
 */

import type { SchemeStyle, StyleScheme } from './style-scheme.ts';
import { SCOPE_MAP, SCOPE_MAP_ORDER, type GtkSourceViewStyleName } from './scopes.ts';

export interface TokenColorSettings {
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

export interface TokenColorRule {
  scope: string | string[];
  settings: TokenColorSettings;
}

export type SemanticTokenColors = Record<string, string>;

/** Underline styles that map onto TextMate's single `underline` font style. */
const UNDERLINE_TO_FONT_STYLE: Partial<Record<NonNullable<SchemeStyle['underline']>, string>> = {
  single: 'underline',
  double: 'underline',
  low: 'underline',
  dotted: 'underline',
  dashed: 'underline',
  error: 'underline',
};

/** gtksv attribute to TextMate font style, in output order. */
const FONT_STYLE_ORDER = ['italic', 'bold', 'underline', 'strikethrough'] as const;

function fontStyleOf(style: SchemeStyle): string {
  const parts: string[] = [];
  if (style.italic) parts.push('italic');
  if (style.bold) parts.push('bold');
  if (style.underline && style.underline !== 'none') {
    parts.push(UNDERLINE_TO_FONT_STYLE[style.underline] ?? 'underline');
  }
  if (style.strikethrough) parts.push('strikethrough');
  return FONT_STYLE_ORDER.filter((name) => parts.includes(name)).join(' ');
}

function settingsOf(style: SchemeStyle): TokenColorSettings {
  const settings: TokenColorSettings = {};
  if (style.foreground !== undefined) settings.foreground = style.foreground;
  if (style.background !== undefined) settings.background = style.background;
  const fontStyle = fontStyleOf(style);
  if (fontStyle !== '') settings.fontStyle = fontStyle;
  return settings;
}

export interface BuildSyntaxColorsResult {
  rules: TokenColorRule[];
  /** Styles declared by the scheme that the scope map does not reference. */
  unmappedStyles: string[];
}

/**
 * Convert a scheme into TextMate rules.
 *
 * Rules whose scope list is empty are dropped: a TextMate rule without a
 * selector matches nothing and only adds noise to the generated file.
 */
export function buildSyntaxColors(scheme: StyleScheme): BuildSyntaxColorsResult {
  const rules: TokenColorRule[] = [];
  const mapped = new Set<string>(SCOPE_MAP_ORDER);

  for (const styleName of SCOPE_MAP_ORDER) {
    const selectors = SCOPE_MAP[styleName as GtkSourceViewStyleName];
    const style = scheme.styles[styleName];
    if (style === undefined) {
      throw new Error(`Scheme "${scheme.id}" is missing style "${styleName}"`);
    }
    if (selectors.length === 0) {
      continue;
    }

    const settings = settingsOf(style);
    if (Object.keys(settings).length === 0) {
      continue;
    }

    rules.push({
      scope: selectors.length === 1 ? selectors[0] : [...selectors],
      settings,
    });
  }

  const unmappedStyles = Object.keys(scheme.styles)
    .filter((name) => !mapped.has(name))
    .sort();

  return { rules, unmappedStyles };
}

/**
 * Semantic token colours for the standard token types and modifiers.
 *
 * Language servers classify code far more precisely than a TextMate grammar
 * can, so these rules are what most users actually see in TypeScript, Rust,
 * Python and Go. Each entry points at the same Adwaita style that the
 * equivalent TextMate rule uses, which keeps the two paths visually identical.
 */
export function buildSemanticTokenColors(scheme: StyleScheme): SemanticTokenColors {
  const style = (name: string): string => {
    const resolved = scheme.styles[name];
    if (resolved?.foreground === undefined) {
      throw new Error(`Scheme "${scheme.id}" style "${name}" has no foreground colour`);
    }
    return resolved.foreground;
  };

  const text = style('text');
  const statement = style('def:statement');
  const type = style('def:type');
  const string = style('def:string');
  const number = style('def:number');
  const constant = style('def:constant');
  const comment = style('def:comment');
  const docComment = style('def:doc-comment-element');
  const preprocessor = style('def:preprocessor');
  const macro = style('rust:macro');
  const lifetime = style('rust:lifetime');

  return {
    // Types and namespaces. TextMate reaches these through def:type.
    namespace: type,
    'namespace.declaration': type,
    'namespace.module': type,
    type: type,
    'type.declaration': type,
    'type.defaultLibrary': type,
    class: type,
    'class.declaration': type,
    'class.defaultLibrary': type,
    struct: type,
    'struct.declaration': type,
    'struct.defaultLibrary': type,
    interface: type,
    'interface.declaration': type,
    'interface.defaultLibrary': type,
    enum: type,
    'enum.declaration': type,
    'enum.defaultLibrary': type,
    typeParameter: type,
    'typeParameter.declaration': type,

    // Values. The Adwaita scheme deliberately leaves variables, parameters and
    // properties at the default colour, so the semantic path has to as well:
    // otherwise a language server would recolour code that the TextMate grammar
    // intentionally leaves plain, and the same file would look different
    // depending on whether semantic highlighting is active.
    parameter: text,
    'parameter.declaration': text,
    variable: text,
    'variable.declaration': text,
    property: text,
    'property.declaration': text,
    // Read-only and library values behave like constants, matching the
    // `constant.language` selectors under def:constant.
    'variable.readonly': constant,
    'variable.defaultLibrary': constant,
    'property.readonly': constant,
    'property.defaultLibrary': constant,
    // Enum members are constants.
    enumMember: constant,
    'enumMember.declaration': constant,
    'enumMember.defaultLibrary': constant,
    event: constant,
    'event.declaration': constant,

    // Callables. Function names are uncoloured on purpose: GtkSourceView is    // inconsistent about them, and the upstream theme chose less colour over
    // more. Macros are the exception, because the Rust scheme does colour them.
    function: text,
    'function.declaration': text,
    'function.defaultLibrary': text,
    method: text,
    'method.declaration': text,
    'method.defaultLibrary': text,
    member: text,
    'member.declaration': text,
    'member.defaultLibrary': text,
    macro: macro,

    // Keywords and operators.
    keyword: statement,
    'keyword.controlFlow': statement,
    'keyword.declaration': statement,
    'keyword.other': statement,
    // Symbolic operators stay at the default colour, as they do in TextMate.
    operator: text,
    modifier: statement,

    // Literals and comments.
    comment: comment,
    'comment.documentation': docComment,
    string: string,
    'string.escape': number,
    number: number,
    'number.float': number,
    regexp: string,

    // Language specific extensions.
    lifetime: lifetime,
    attribute: preprocessor,
    decorator: preprocessor,
    builtin: type,
    label: statement,
    selfKeyword: statement,
  };
}
