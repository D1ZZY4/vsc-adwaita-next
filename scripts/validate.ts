#!/usr/bin/env bun
/**
 * Validate the extension's contributed assets.
 *
 *   bun scripts/validate.ts
 *
 * Checks, in order:
 *   1. package.json: manifest shape, contribution paths, theme labels, metadata.
 *   2. Colour themes: every declared file exists, parses, and conforms to the
 *      VS Code colour theme schema shape (no unknown keys, no malformed
 *      colours, no contradictory `type`).
 *   3. Token colours: every rule has a non-empty scope and valid settings.
 *   4. Product icon theme: valid JSON, resolvable codepoints, existing fonts.
 *   5. Design tokens: palette values are valid and text contrast meets WCAG AA.
 *
 * The validator is intentionally strict: a theme extension has no runtime to
 * catch mistakes, so a broken key ships silently.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ADWAITA_DARK_RAMP, ADWAITA_PALETTE, ADWAITA_SURFACES } from '../src/adwaita.ts';
import { contrastRatio, normalizeHex } from '../src/color.ts';
import { SCOPE_MAP } from '../src/scopes.ts';
import { buildWorkbenchTokens } from '../src/workbench.ts';
import { validateIcons } from './icon-support.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

interface Problem {
  file: string;
  message: string;
}

interface ContrastCheck {
  name: string;
  foreground: string;
  background: string;
  /** WCAG 2.1 minimum for the relevant text size. */
  minimum: number;
}

const problems: Problem[] = [];
const notes: string[] = [];

function fail(file: string, message: string): void {
  problems.push({ file, message });
}

function note(message: string): void {
  notes.push(message);
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

// ---------------------------------------------------------------------------
// Colour value syntax
// ---------------------------------------------------------------------------

const COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function isValidColorValue(value: unknown): value is string {
  return typeof value === 'string' && COLOR_PATTERN.test(value.trim());
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

interface ManifestTheme {
  label?: unknown;
  uiTheme?: unknown;
  path?: unknown;
}

interface Manifest {
  name?: unknown;
  displayName?: unknown;
  version?: unknown;
  publisher?: unknown;
  license?: unknown;
  icon?: unknown;
  engines?: { vscode?: unknown };
  repository?: unknown;
  bugs?: unknown;
  homepage?: unknown;
  contributes?: {
    themes?: ManifestTheme[];
    productIconThemes?: Array<{ id?: unknown; label?: unknown; path?: unknown }>;
  };
}

async function validateManifest(): Promise<void> {
  const manifestPath = join(ROOT, 'package.json');
  let manifest: Manifest;
  try {
    manifest = await readJson<Manifest>(manifestPath);
  } catch (error) {
    fail('package.json', `does not parse: ${(error as Error).message}`);
    return;
  }

  const required: Array<[string, unknown]> = [
    ['name', manifest.name],
    ['displayName', manifest.displayName],
    ['version', manifest.version],
    ['publisher', manifest.publisher],
    ['license', manifest.license],
    ['engines.vscode', manifest.engines?.vscode],
  ];
  for (const [key, value] of required) {
    if (typeof value !== 'string' || value === '') {
      fail('package.json', `missing required field "${key}"`);
    }
  }

  if (manifest.name !== 'vsc-adwaita-next') {
    fail(
      'package.json',
      `extension name must be "vsc-adwaita-next", got "${String(manifest.name)}"`,
    );
  }
  if (manifest.license !== 'GPL-3.0-only') {
    fail('package.json', `license must stay GPL-3.0-only, got "${String(manifest.license)}"`);
  }
  if (manifest.publisher === 'piousdeer') {
    fail('package.json', 'publisher still points at the upstream author');
  }

  const version = manifest.version;
  if (typeof version === 'string' && !/^\d+\.\d+\.\d+$/.test(version)) {
    fail('package.json', `version "${version}" is not semver x.y.z`);
  }

  for (const urlField of ['repository', 'bugs', 'homepage'] as const) {
    const value = manifest[urlField];
    const url = typeof value === 'string' ? value : (value as { url?: unknown } | undefined)?.url;
    if (typeof url === 'string' && url.includes('piousdeer/vscode-adwaita')) {
      fail('package.json', `${urlField} still points at the upstream repository`);
    }
  }

  const icon = manifest.icon;
  if (typeof icon !== 'string' || !existsSync(join(ROOT, icon))) {
    fail('package.json', `icon "${String(icon)}" does not exist`);
  } else if (!icon.endsWith('.png')) {
    fail('package.json', 'extension icon must be a PNG for marketplace packaging');
  }

  const themes = manifest.contributes?.themes ?? [];
  if (themes.length !== 8) {
    fail('package.json', `expected 8 colour themes, found ${themes.length}`);
  }

  const uiThemes = new Set<string>();
  for (const theme of themes) {
    const { label, path, uiTheme } = theme;
    if (typeof label !== 'string' || label === '') {
      fail('package.json', 'a colour theme contribution has no label');
      continue;
    }
    if (typeof path !== 'string' || !existsSync(join(ROOT, path))) {
      fail('package.json', `theme "${label}" points at a missing file "${String(path)}"`);
      continue;
    }
    if (uiTheme !== 'vs' && uiTheme !== 'vs-dark') {
      fail('package.json', `theme "${label}" has unsupported uiTheme "${String(uiTheme)}"`);
      continue;
    }
    uiThemes.add(uiTheme);
    if (!label.startsWith('Adwaita ')) {
      fail('package.json', `theme label "${label}" should keep the "Adwaita " prefix`);
    }
  }
  if (!uiThemes.has('vs') || !uiThemes.has('vs-dark')) {
    fail('package.json', 'both light (vs) and dark (vs-dark) themes must be contributed');
  }

  const iconThemes = manifest.contributes?.productIconThemes ?? [];
  if (iconThemes.length !== 1) {
    fail('package.json', `expected 1 product icon theme, found ${iconThemes.length}`);
  }
  for (const iconTheme of iconThemes) {
    const { path } = iconTheme;
    if (typeof path !== 'string' || !existsSync(join(ROOT, path))) {
      fail('package.json', `product icon theme points at a missing file "${String(path)}"`);
    }
  }

  note(`manifest: ${themes.length} colour themes, ${iconThemes.length} product icon theme(s)`);
}

// ---------------------------------------------------------------------------
// Colour themes
// ---------------------------------------------------------------------------

let knownColorIds: Set<string> | null = null;

async function loadKnownColorIds(): Promise<Set<string>> {
  if (knownColorIds !== null) return knownColorIds;
  const raw = await readJson<{ ids?: unknown }>(join(ROOT, 'src/vscode-color-ids.json'));
  if (!Array.isArray(raw.ids) || raw.ids.length === 0) {
    throw new Error('src/vscode-color-ids.json has no ids');
  }
  knownColorIds = new Set(raw.ids as string[]);
  return knownColorIds;
}

interface ThemeDocument {
  $schema?: unknown;
  name?: unknown;
  type?: unknown;
  colors?: unknown;
  semanticHighlighting?: unknown;
  semanticTokenColors?: unknown;
  tokenColors?: unknown;
}

const ALLOWED_FONT_STYLES = new Set(['italic', 'bold', 'underline', 'strikethrough']);

async function validateTheme(file: string, expectedType: 'light' | 'dark'): Promise<void> {
  const relative = `themes/${file}`;
  const path = join(ROOT, 'themes', file);

  let document: ThemeDocument;
  try {
    document = await readJson<ThemeDocument>(path);
  } catch (error) {
    fail(relative, `does not parse: ${(error as Error).message}`);
    return;
  }

  if (document.$schema !== 'vscode://schemas/color-theme') {
    fail(relative, `unexpected $schema "${String(document.$schema)}"`);
  }
  if (typeof document.name !== 'string' || document.name === '') {
    fail(relative, 'missing name');
  }
  if (document.type !== expectedType) {
    fail(relative, `type is "${String(document.type)}" but the variant is ${expectedType}`);
  }

  const colors = document.colors;
  if (typeof colors !== 'object' || colors === null) {
    fail(relative, 'missing colors object');
  } else {
    const entries = Object.entries(colors as Record<string, unknown>);
    if (entries.length < 200) {
      fail(relative, `only ${entries.length} colour keys, expected a full workbench mapping`);
    }
    const known = await loadKnownColorIds();
    const unknownKeys: string[] = [];
    for (const [key, value] of entries) {
      if (!isValidColorValue(value)) {
        fail(relative, `colour "${key}" has malformed value "${String(value)}"`);
      }
      if (!known.has(key)) {
        unknownKeys.push(key);
      }
    }
    if (unknownKeys.length > 0) {
      fail(relative, `unsupported colour keys: ${unknownKeys.join(', ')}`);
    }
    note(`${relative}: ${entries.length} colour keys`);
  }

  if (document.semanticHighlighting !== true) {
    fail(relative, 'semanticHighlighting should be enabled');
  }

  const semanticTokenColors = document.semanticTokenColors;
  if (typeof semanticTokenColors !== 'object' || semanticTokenColors === null) {
    fail(relative, 'missing semanticTokenColors object');
  } else {
    for (const [key, value] of Object.entries(semanticTokenColors as Record<string, unknown>)) {
      if (!isValidColorValue(value)) {
        fail(relative, `semantic token colour "${key}" has malformed value "${String(value)}"`);
      }
    }
  }

  const tokenColors = document.tokenColors;
  if (!Array.isArray(tokenColors) || tokenColors.length === 0) {
    fail(relative, 'missing tokenColors array');
    return;
  }

  // VS Code's own default themes deliberately declare the same scope twice (a
  // later, more specific rule wins). We own our Adwaita rules, so only those
  // are held to the no-duplicates standard.
  const ownsRules = !relative.includes('default-syntax-highlighting');

  const seenScopes = new Map<string, number>();
  tokenColors.forEach((rule: unknown, index: number) => {
    if (typeof rule !== 'object' || rule === null) {
      fail(relative, `tokenColors[${index}] is not an object`);
      return;
    }
    const { scope, settings } = rule as { scope?: unknown; settings?: unknown };
    const scopes = typeof scope === 'string' ? [scope] : scope;
    if (!Array.isArray(scopes) || scopes.length === 0) {
      fail(relative, `tokenColors[${index}] has no scope`);
    } else {
      for (const entry of scopes as unknown[]) {
        if (typeof entry !== 'string') {
          fail(relative, `tokenColors[${index}] has a non-string scope`);
        } else if (entry !== '') {
          const previous = seenScopes.get(entry);
          if (previous !== undefined && ownsRules) {
            fail(relative, `scope "${entry}" is declared by rules ${previous} and ${index}`);
          } else if (previous === undefined) {
            seenScopes.set(entry, index);
          }
        }
      }
    }

    if (typeof settings !== 'object' || settings === null) {
      fail(relative, `tokenColors[${index}] has no settings`);
      return;
    }
    const { foreground, background, fontStyle } = settings as Record<string, unknown>;
    if (foreground !== undefined && !isValidColorValue(foreground)) {
      fail(relative, `tokenColors[${index}] foreground "${String(foreground)}" is malformed`);
    }
    if (background !== undefined && !isValidColorValue(background)) {
      fail(relative, `tokenColors[${index}] background "${String(background)}" is malformed`);
    }
    if (fontStyle !== undefined) {
      for (const part of String(fontStyle).split(/\s+/).filter(Boolean)) {
        if (!ALLOWED_FONT_STYLES.has(part)) {
          fail(relative, `tokenColors[${index}] fontStyle "${part}" is not supported`);
        }
      }
    }
  });

  note(`${relative}: ${tokenColors.length} token rules`);
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

function validatePalette(): void {
  let checked = 0;
  const check = (value: string, where: string): void => {
    try {
      normalizeHex(value);
      checked += 1;
    } catch {
      fail('src/adwaita.ts', `${where} is not a valid colour`);
    }
  };

  for (const [name, value] of Object.entries(ADWAITA_PALETTE)) check(value, `palette ${name}`);
  for (const [variant, ramp] of Object.entries(ADWAITA_DARK_RAMP)) {
    for (const [level, value] of Object.entries(ramp))
      check(value, `dark ramp ${variant}/${level}`);
  }
  for (const [variant, surfaces] of Object.entries(ADWAITA_SURFACES)) {
    for (const [key, value] of Object.entries(surfaces)) check(value, `surface ${variant}.${key}`);
  }

  note(`palette: ${checked} token values, ${Object.keys(SCOPE_MAP).length} mapped styles`);
}

function reportContrast(): void {
  for (const variant of ['light', 'dark'] as const) {
    const tokens = buildWorkbenchTokens(variant);
    const checks: ContrastCheck[] = [
      {
        name: 'editor foreground',
        foreground: tokens.fg,
        background: tokens.editorBg,
        minimum: 4.5,
      },
      {
        name: 'sidebar foreground',
        foreground: tokens.fg,
        background: tokens.sidebarBg,
        minimum: 4.5,
      },
      {
        name: 'status bar foreground',
        foreground: tokens.fg,
        background: tokens.windowBg,
        minimum: 4.5,
      },
      {
        name: 'muted foreground',
        foreground: tokens.fgMuted,
        background: tokens.sidebarBg,
        minimum: 4.5,
      },
      {
        name: 'line numbers',
        foreground: tokens.lineNumberFg,
        background: tokens.editorBg,
        minimum: 3,
      },
      {
        name: 'accent foreground',
        foreground: tokens.fgOnAccent,
        background: tokens.accentBg,
        // 3:1, not 4.5:1. libadwaita pairs `accent_fg_color` (white) with
        // `accent_bg_color` (blue_3, #3584e4), which is 3.77:1. Matching
        // upstream is the right call here: button and badge labels are bold and
        // large, which is the WCAG large-text threshold.
        minimum: 3,
      },
      {
        name: 'active tab foreground',
        foreground: tokens.fg,
        background: tokens.tabActiveBg,
        minimum: 4.5,
      },
      {
        name: 'inactive tab foreground',
        foreground: tokens.fgMuted,
        background: tokens.tabInactiveBg,
        minimum: 4.5,
      },
      {
        name: 'menu foreground',
        foreground: tokens.fg,
        background: tokens.overlayBg,
        minimum: 4.5,
      },
      { name: 'input foreground', foreground: tokens.fg, background: tokens.inputBg, minimum: 4.5 },
      // WCAG 1.4.11 non-text contrast: the focus ring must stay visible
      // against every surface it can appear on.
      {
        name: 'focus ring on editor',
        foreground: tokens.focusBorder,
        background: tokens.editorBg,
        minimum: 3,
      },
      {
        name: 'focus ring on sidebar',
        foreground: tokens.focusBorder,
        background: tokens.sidebarBg,
        minimum: 3,
      },
      {
        name: 'focus ring on overlay',
        foreground: tokens.focusBorder,
        background: tokens.overlayBg,
        minimum: 3,
      },
    ];

    for (const check of checks) {
      const ratio = contrastRatio(check.foreground, check.background);
      const status = ratio >= check.minimum ? 'ok' : 'LOW';
      note(
        `contrast ${variant} ${check.name}: ${ratio.toFixed(2)}:1 (min ${check.minimum}) ${status}`,
      );
      if (ratio < check.minimum) {
        fail(
          'src/workbench.ts',
          `${variant} ${check.name} contrast ${ratio.toFixed(2)}:1 is below ${check.minimum}:1`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Product icons
// ---------------------------------------------------------------------------

async function validateIconTheme(): Promise<void> {
  const manifestPath = join(ROOT, 'icons/adwaita.json');
  interface IconManifest {
    fonts?: Array<{ id?: unknown; src?: Array<{ path?: unknown; format?: unknown }> }>;
    iconDefinitions?: unknown;
  }

  let manifest: IconManifest;
  try {
    manifest = await readJson<IconManifest>(manifestPath);
  } catch (error) {
    fail('icons/adwaita.json', `does not parse: ${(error as Error).message}`);
    return;
  }

  for (const font of manifest.fonts ?? []) {
    for (const source of font.src ?? []) {
      if (typeof source.path !== 'string' || !existsSync(join(ROOT, 'icons', source.path))) {
        fail('icons/adwaita.json', `font source "${String(source.path)}" does not exist`);
      }
    }
  }

  const result = await validateIcons(join(ROOT, 'icons'));
  for (const message of result.messages) note(message);
  if (!result.ok) {
    fail('icons/adwaita.json', 'icon theme validation failed');
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const THEME_FILES: ReadonlyArray<[string, 'light' | 'dark']> = [
  ['dark.json', 'dark'],
  ['dark-colorful-status-bar.json', 'dark'],
  ['dark-default-syntax-highlighting.json', 'dark'],
  ['dark-default-syntax-highlighting-colorful-status-bar.json', 'dark'],
  ['light.json', 'light'],
  ['light-colorful-status-bar.json', 'light'],
  ['light-default-syntax-highlighting.json', 'light'],
  ['light-default-syntax-highlighting-colorful-status-bar.json', 'light'],
];

async function main(): Promise<void> {
  await validateManifest();
  validatePalette();

  for (const [file, variant] of THEME_FILES) {
    await validateTheme(file, variant);
  }

  reportContrast();
  await validateIconTheme();

  for (const line of notes) console.log(`  ${line}`);

  if (problems.length > 0) {
    console.error(`\nValidation failed with ${problems.length} problem(s):`);
    for (const problem of problems) {
      console.error(`  ${problem.file}: ${problem.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('\nValidation passed.');
}

await main();
