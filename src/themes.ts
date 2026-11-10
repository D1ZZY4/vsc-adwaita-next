/**
 * Theme assembly.
 *
 * A theme variant is the product of three independent choices:
 *
 *   variant          light or dark
 *   syntax source    Adwaita (GtkSourceView) or VS Code's built-in defaults
 *   status bar       neutral or coloured by context
 *
 * That gives eight variants, which are generated deterministically from the
 * same token sources. Nothing in this module writes to disk; the CLI in
 * `scripts/` owns I/O.
 */

import { readFile } from 'node:fs/promises';

import type { ThemeVariant } from './adwaita.ts';
import {
  buildSemanticTokenColors,
  buildSyntaxColors,
  type SemanticTokenColors,
  type TokenColorRule,
} from './syntax.ts';
import { loadStyleScheme, type StyleScheme } from './style-scheme.ts';
import { buildWorkbenchColors, type WorkbenchColors } from './workbench-colors.ts';
import { buildWorkbenchTokens, type WorkbenchTokens } from './workbench.ts';

export type SyntaxSource = 'adwaita' | 'default';

export interface DefaultThemeDefinition {
  source: string;
  tokenColors: TokenColorRule[];
  semanticTokenColors: SemanticTokenColors;
}

export interface ThemeVariantDefinition {
  /** Stable identifier used for file names and package.json labels. */
  id: string;
  label: string;
  variant: ThemeVariant;
  syntaxSource: SyntaxSource;
  colorfulStatusBar: boolean;
  uiTheme: 'vs' | 'vs-dark';
}

export interface BuiltTheme {
  definition: ThemeVariantDefinition;
  colors: WorkbenchColors;
  tokenColors: TokenColorRule[];
  semanticTokenColors: SemanticTokenColors;
  tokens: WorkbenchTokens;
  /** File name inside `themes/`, without a directory prefix. */
  fileName: string;
}

export const THEME_VARIANTS: readonly ThemeVariantDefinition[] = [
  {
    id: 'dark',
    label: 'Adwaita Dark',
    variant: 'dark',
    syntaxSource: 'adwaita',
    colorfulStatusBar: false,
    uiTheme: 'vs-dark',
  },
  {
    id: 'dark-colorful-status-bar',
    label: 'Adwaita Dark & colorful status bar',
    variant: 'dark',
    syntaxSource: 'adwaita',
    colorfulStatusBar: true,
    uiTheme: 'vs-dark',
  },
  {
    id: 'dark-default-syntax-highlighting',
    label: 'Adwaita Dark & default syntax highlighting',
    variant: 'dark',
    syntaxSource: 'default',
    colorfulStatusBar: false,
    uiTheme: 'vs-dark',
  },
  {
    id: 'dark-default-syntax-highlighting-colorful-status-bar',
    label: 'Adwaita Dark & default syntax highlighting & colorful status bar',
    variant: 'dark',
    syntaxSource: 'default',
    colorfulStatusBar: true,
    uiTheme: 'vs-dark',
  },
  {
    id: 'light',
    label: 'Adwaita Light',
    variant: 'light',
    syntaxSource: 'adwaita',
    colorfulStatusBar: false,
    uiTheme: 'vs',
  },
  {
    id: 'light-colorful-status-bar',
    label: 'Adwaita Light & colorful status bar',
    variant: 'light',
    syntaxSource: 'adwaita',
    colorfulStatusBar: true,
    uiTheme: 'vs',
  },
  {
    id: 'light-default-syntax-highlighting',
    label: 'Adwaita Light & default syntax highlighting',
    variant: 'light',
    syntaxSource: 'default',
    colorfulStatusBar: false,
    uiTheme: 'vs',
  },
  {
    id: 'light-default-syntax-highlighting-colorful-status-bar',
    label: 'Adwaita Light & default syntax highlighting & colorful status bar',
    variant: 'light',
    syntaxSource: 'default',
    colorfulStatusBar: true,
    uiTheme: 'vs',
  },
];

/** Convert a theme label into its file name, matching the labels exactly. */
export function themeFileName(id: string): string {
  return `${id}.json`;
}

export interface ThemeSources {
  schemes: Record<ThemeVariant, StyleScheme>;
  defaultThemes: Record<ThemeVariant, DefaultThemeDefinition>;
}

/** Load every upstream data source the theme generator needs. */
export async function loadThemeSources(paths: {
  lightScheme: string | URL;
  darkScheme: string | URL;
  defaultThemes: string | URL;
}): Promise<ThemeSources> {
  const [lightScheme, darkScheme, defaultThemesRaw] = await Promise.all([
    loadStyleScheme(paths.lightScheme, 'light'),
    loadStyleScheme(paths.darkScheme, 'dark'),
    readJson(paths.defaultThemes),
  ]);

  const defaultThemes = {
    light: parseDefaultTheme(defaultThemesRaw.light, 'light'),
    dark: parseDefaultTheme(defaultThemesRaw.dark, 'dark'),
  };

  if (lightScheme.pairedVariantId !== undefined && lightScheme.pairedVariantId !== darkScheme.id) {
    throw new Error(
      `Light scheme "${lightScheme.id}" declares dark variant "${lightScheme.pairedVariantId}" ` +
        `but the loaded dark scheme is "${darkScheme.id}"`,
    );
  }

  return { schemes: { light: lightScheme, dark: darkScheme }, defaultThemes };
}

function parseDefaultTheme(raw: unknown, variant: ThemeVariant): DefaultThemeDefinition {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Default ${variant} theme is not an object`);
  }
  const value = raw as Record<string, unknown>;
  const tokenColors = value.tokenColors;
  const semanticTokenColors = value.semanticTokenColors ?? {};
  const source = value.source;

  if (!Array.isArray(tokenColors)) {
    throw new Error(`Default ${variant} theme has no tokenColors array`);
  }
  if (typeof source !== 'string' || source === '') {
    throw new Error(`Default ${variant} theme has no provenance string`);
  }
  if (typeof semanticTokenColors !== 'object' || semanticTokenColors === null) {
    throw new Error(`Default ${variant} theme has a malformed semanticTokenColors object`);
  }

  return {
    source,
    tokenColors: tokenColors as TokenColorRule[],
    semanticTokenColors: semanticTokenColors as SemanticTokenColors,
  };
}

async function readJson(path: string | URL): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
}

export interface BuildThemeOptions {
  sources: ThemeSources;
  definition: ThemeVariantDefinition;
}

/** Build one complete theme object, ready to be serialised. */
export function buildTheme({ sources, definition }: BuildThemeOptions): BuiltTheme {
  const { variant, syntaxSource, colorfulStatusBar } = definition;
  const scheme = sources.schemes[variant];

  const tokens = buildWorkbenchTokens(variant);
  const colors = buildWorkbenchColors(tokens, colorfulStatusBar);

  let tokenColors: TokenColorRule[];
  let semanticTokenColors: SemanticTokenColors;

  if (syntaxSource === 'adwaita') {
    const built = buildSyntaxColors(scheme);
    tokenColors = built.rules;
    semanticTokenColors = buildSemanticTokenColors(scheme);
  } else {
    const defaults = sources.defaultThemes[variant];
    tokenColors = defaults.tokenColors;
    semanticTokenColors = defaults.semanticTokenColors;
  }

  return {
    definition,
    colors,
    tokenColors,
    semanticTokenColors,
    tokens,
    fileName: themeFileName(definition.id),
  };
}

/** Build every declared variant. */
export function buildAllThemes(sources: ThemeSources): BuiltTheme[] {
  return THEME_VARIANTS.map((definition) => buildTheme({ sources, definition }));
}

/** Serialise a theme the way VS Code expects to read it. */
export function serializeTheme(theme: BuiltTheme): string {
  const document = {
    $schema: 'vscode://schemas/color-theme',
    name: theme.definition.label,
    type: theme.definition.variant,
    colors: theme.colors,
    semanticHighlighting: true,
    semanticTokenColors: theme.semanticTokenColors,
    tokenColors: theme.tokenColors,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}
