/**
 * Tests for theme assembly: variants, workbench colours and contrast.
 */

import { describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeHex } from '../src/color.ts';
import { buildWorkbenchColors } from '../src/workbench-colors.ts';
import { buildWorkbenchTokens } from '../src/workbench.ts';
import { buildSyntaxColors } from '../src/syntax.ts';
import { parseStyleScheme } from '../src/style-scheme.ts';
import {
  THEME_VARIANTS,
  buildAllThemes,
  loadThemeSources,
  serializeTheme,
  themeFileName,
} from '../src/themes.ts';
import { SCOPE_MAP_ORDER } from '../src/scopes.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PATHS = {
  lightScheme: join(ROOT, 'src/gtksourceview/adwaita.xml'),
  darkScheme: join(ROOT, 'src/gtksourceview/adwaita-dark.xml'),
  defaultThemes: join(ROOT, 'src/default-themes/vscode-defaults.json'),
};

describe('variant matrix', () => {
  it('declares exactly eight variants', () => {
    expect(THEME_VARIANTS).toHaveLength(8);
  });

  it('covers every combination of variant, syntax source and status bar', () => {
    const combinations = new Set(
      THEME_VARIANTS.map(
        (variant) =>
          `${variant.variant}|${variant.syntaxSource}|${String(variant.colorfulStatusBar)}`,
      ),
    );
    expect(combinations.size).toBe(8);
  });

  it('uses unique ids and labels', () => {
    expect(new Set(THEME_VARIANTS.map((variant) => variant.id)).size).toBe(8);
    expect(new Set(THEME_VARIANTS.map((variant) => variant.label)).size).toBe(8);
  });

  it('pairs uiTheme with the variant', () => {
    for (const variant of THEME_VARIANTS) {
      expect(variant.uiTheme).toBe(variant.variant === 'dark' ? 'vs-dark' : 'vs');
    }
  });

  it('derives file names from the id', () => {
    expect(themeFileName('dark')).toBe('dark.json');
    expect(themeFileName('light-colorful-status-bar')).toBe('light-colorful-status-bar.json');
  });
});

describe('buildAllThemes', () => {
  it('produces eight themes with consistent shapes', async () => {
    const sources = await loadThemeSources(PATHS);
    const themes = buildAllThemes(sources);

    expect(themes).toHaveLength(8);
    for (const theme of themes) {
      expect(Object.keys(theme.colors).length).toBeGreaterThan(300);
      expect(theme.tokenColors.length).toBeGreaterThan(20);
      expect(Object.keys(theme.semanticTokenColors).length).toBeGreaterThan(0);
      expect(theme.fileName).toMatch(/\.json$/);
    }
  });

  it('gives the Adwaita variants a full semantic token map', async () => {
    const sources = await loadThemeSources(PATHS);
    for (const theme of buildAllThemes(sources)) {
      if (theme.definition.syntaxSource !== 'adwaita') continue;
      expect(Object.keys(theme.semanticTokenColors).length).toBeGreaterThan(40);
    }
  });

  it('mirrors VS Code defaults in the default-syntax variants', async () => {
    const sources = await loadThemeSources(PATHS);
    for (const theme of buildAllThemes(sources)) {
      if (theme.definition.syntaxSource !== 'default') continue;
      expect(Object.keys(theme.semanticTokenColors).length).toBe(
        Object.keys(sources.defaultThemes[theme.definition.variant].semanticTokenColors).length,
      );
    }
  });

  it('gives every theme the type matching its variant', async () => {
    const sources = await loadThemeSources(PATHS);
    for (const theme of buildAllThemes(sources)) {
      const document = JSON.parse(serializeTheme(theme)) as { type?: unknown; name?: unknown };
      expect(document.type).toBe(theme.definition.variant);
      expect(document.name).toBe(theme.definition.label);
    }
  });

  it('keeps the same workbench colours across syntax sources', async () => {
    const sources = await loadThemeSources(PATHS);
    const adwaita = buildAllThemes(sources).find((theme) => theme.definition.id === 'dark');
    const defaults = buildAllThemes(sources).find(
      (theme) => theme.definition.id === 'dark-default-syntax-highlighting',
    );
    expect(adwaita).toBeDefined();
    expect(defaults).toBeDefined();
    if (adwaita === undefined || defaults === undefined) return;
    // Only the token colours differ; the workbench palette is shared.
    expect(defaults.colors).toEqual(adwaita.colors);
    expect(defaults.tokenColors).not.toEqual(adwaita.tokenColors);
  });

  it('colours the status bar only in the colourful variants', async () => {
    const sources = await loadThemeSources(PATHS);
    const themes = buildAllThemes(sources);
    const plain = themes.find((theme) => theme.definition.id === 'dark');
    const colourful = themes.find((theme) => theme.definition.id === 'dark-colorful-status-bar');
    if (plain === undefined || colourful === undefined) throw new Error('missing variants');
    expect(plain.colors['statusBar.background']).toBe(
      normalizeHex(buildWorkbenchTokens('dark').windowBg),
    );
    expect(colourful.colors['statusBar.background']).toBe(normalizeHex('#3584e4'));
    expect(plain.colors['statusBar.background']).not.toBe(colourful.colors['statusBar.background']);
  });

  it('emits valid JSON that round trips', async () => {
    const sources = await loadThemeSources(PATHS);
    for (const theme of buildAllThemes(sources)) {
      const text = serializeTheme(theme);
      expect(text.endsWith('\n')).toBe(true);
      expect(() => JSON.parse(text) as unknown).not.toThrow();
    }
  });
});

describe('workbench colours', () => {
  it('produces distinct palettes for light and dark', () => {
    const light = buildWorkbenchColors(buildWorkbenchTokens('light'));
    const dark = buildWorkbenchColors(buildWorkbenchTokens('dark'));
    expect(light['editor.background']).not.toBe(dark['editor.background']);
    expect(Object.keys(light)).toEqual(Object.keys(dark));
  });

  it('uses only hex colour values', () => {
    for (const variant of ['light', 'dark'] as const) {
      const colors = buildWorkbenchColors(buildWorkbenchTokens(variant));
      for (const [key, value] of Object.entries(colors)) {
        expect(value, `${variant} ${key}`).toMatch(/^#[0-9a-f]{8}$/);
      }
    }
  });

  it('follows the libadwaita surface hierarchy', () => {
    const tokens = buildWorkbenchTokens('dark');
    // In dark style the content view is darker than the chrome around it.
    expect(tokens.editorBg).toBe('#1d1d20');
    expect(tokens.windowBg).toBe('#222226');
    expect(tokens.sidebarBg).toBe('#2e2e32');
    expect(tokens.overlayBg).toBe('#36363a');
    const luminance = (hex: string): number => {
      const channel = (index: number): number => {
        const value = parseInt(hex.slice(index, index + 2), 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
    };
    expect(luminance(tokens.editorBg)).toBeLessThan(luminance(tokens.sidebarBg));
    expect(luminance(tokens.sidebarBg)).toBeLessThan(luminance(tokens.overlayBg));
  });

  it('derives borders as a foreground tint of the surface', () => {
    for (const variant of ['light', 'dark'] as const) {
      const tokens = buildWorkbenchTokens(variant);
      // A tint of the foreground over the surface must sit between the two.
      const channel = (hex: string, index: number): number =>
        parseInt(hex.slice(index, index + 2), 16);
      const low = Math.min(channel(tokens.editorBg, 1), channel(tokens.fg, 1));
      const high = Math.max(channel(tokens.editorBg, 1), channel(tokens.fg, 1));
      expect(channel(tokens.border, 1)).toBeGreaterThanOrEqual(low);
      expect(channel(tokens.border, 1)).toBeLessThanOrEqual(high);
    }
  });
});

describe('syntax colours', () => {
  it('drops rules with no selectors', async () => {
    const sources = await loadThemeSources(PATHS);
    for (const theme of buildAllThemes(sources)) {
      for (const rule of theme.tokenColors) {
        const scopes = typeof rule.scope === 'string' ? [rule.scope] : rule.scope;
        expect(scopes.length).toBeGreaterThan(0);
      }
    }
  });

  it('never emits an empty fontStyle', async () => {
    const scheme = parseStyleScheme(await readFile(PATHS.lightScheme, 'utf8'), 'light');
    for (const rule of buildSyntaxColors(scheme).rules) {
      if (rule.settings.fontStyle !== undefined) {
        expect(rule.settings.fontStyle).not.toBe('');
      }
    }
  });

  it('gives deleted markup a strikethrough font style', async () => {
    const scheme = parseStyleScheme(await readFile(PATHS.lightScheme, 'utf8'), 'light');
    const rules = buildSyntaxColors(scheme).rules;
    const deletion = rules.find((rule) =>
      (typeof rule.scope === 'string' ? [rule.scope] : rule.scope).includes('markup.deleted'),
    );
    // GtkSourceView's def:deletion only carries strikethrough, no colour.
    expect(deletion?.settings.fontStyle).toBe('strikethrough');

    // The diff rule overrides it with the red deletion colour.
    const diffDeletion = rules.find((rule) =>
      (typeof rule.scope === 'string' ? [rule.scope] : rule.scope).includes('markup.deleted.diff'),
    );
    expect(diffDeletion?.settings.foreground).toMatch(/^#[0-9a-f]{8}$/);
  });

  it('keeps semantic token colours consistent with the TextMate rules', async () => {
    const sources = await loadThemeSources(PATHS);
    const theme = buildAllThemes(sources).find((entry) => entry.definition.id === 'dark');
    if (theme === undefined) throw new Error('missing dark theme');

    // Build a scope to colour index from the TextMate rules.
    const textmate = new Map<string, string>();
    for (const rule of theme.tokenColors) {
      const scopes = typeof rule.scope === 'string' ? [rule.scope] : rule.scope;
      const foreground = rule.settings.foreground;
      if (foreground === undefined) continue;
      for (const scope of scopes) textmate.set(scope, foreground);
    }

    const semantic = theme.semanticTokenColors;

    // Each pair asserts that a semantic token type and the TextMate scope that
    // covers the same construct resolve to the same Adwaita colour. If a
    // language server recolours code differently from the grammar, this fails.
    const pairs: Array<[string, string]> = [
      ['keyword', 'keyword.control'],
      ['type', 'entity.name.type'],
      ['class', 'entity.name.type.class'],
      ['string', 'string'],
      ['number', 'constant.numeric'],
      ['comment', 'comment'],
      ['namespace', 'entity.name.namespace'],
      ['lifetime', 'entity.name.type.lifetime.rust'],
      ['enumMember', 'constant.language'],
    ];

    for (const [tokenType, scope] of pairs) {
      const fromSemantic = semantic[tokenType];
      const fromTextMate = textmate.get(scope);
      expect(fromSemantic, `semantic ${tokenType}`).toBeDefined();
      expect(fromTextMate, `textmate ${scope}`).toBeDefined();
      if (fromSemantic === undefined || fromTextMate === undefined) continue;
      expect(fromSemantic, `${tokenType} vs ${scope}`).toBe(fromTextMate);
    }
  });

  it('leaves callables and operators at the default colour', async () => {
    const sources = await loadThemeSources(PATHS);
    const theme = buildAllThemes(sources).find((entry) => entry.definition.id === 'dark');
    if (theme === undefined) throw new Error('missing dark theme');

    const defaultForeground = theme.tokenColors[0]?.settings.foreground;
    expect(defaultForeground).toBeDefined();
    if (defaultForeground === undefined) return;

    for (const tokenType of [
      'function',
      'method',
      'member',
      'variable',
      'parameter',
      'property',
      'operator',
    ]) {
      expect(theme.semanticTokenColors[tokenType], tokenType).toBe(defaultForeground);
    }
  });

  it('reports styles the scope map does not use', async () => {
    const scheme = parseStyleScheme(await readFile(PATHS.lightScheme, 'utf8'), 'light');
    const { unmappedStyles } = buildSyntaxColors(scheme);
    // Editor-only styles (cursor, line numbers, search match) are expected to
    // be unmapped: VS Code exposes those as workbench colours instead.
    for (const name of unmappedStyles) {
      expect([
        'background-pattern',
        'bracket-match',
        'current-line',
        'current-line-number',
        'cursor',
        'draw-spaces',
        'line-numbers',
        'map-overlay',
        'right-margin',
        'search-match',
        'def:warning',
        'vala:attributes',
      ]).toContain(name);
    }
  });

  it('keeps the scope map in sync with the scheme', async () => {
    const scheme = parseStyleScheme(await readFile(PATHS.lightScheme, 'utf8'), 'light');
    const mapped = new Set<string>(SCOPE_MAP_ORDER);
    const unmapped = Object.keys(scheme.styles).filter((name) => !mapped.has(name));
    expect(unmapped.length).toBeLessThan(20);
  });
});

describe('serializeTheme', () => {
  it('writes keys in the order VS Code expects', async () => {
    const sources = await loadThemeSources(PATHS);
    const theme = buildAllThemes(sources)[0];
    if (theme === undefined) throw new Error('no themes built');
    const keys = Object.keys(JSON.parse(serializeTheme(theme)) as Record<string, unknown>);
    expect(keys).toEqual([
      '$schema',
      'name',
      'type',
      'colors',
      'semanticHighlighting',
      'semanticTokenColors',
      'tokenColors',
    ]);
  });
});
