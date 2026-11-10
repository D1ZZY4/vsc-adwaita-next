#!/usr/bin/env node
/**
 * Build the extension's generated assets.
 *
 *   node scripts/build.ts themes   regenerate themes/*.json
 *   node scripts/build.ts icons    validate icons/ and report the codepoint map
 *   node scripts/build.ts          do both
 *
 * The icon *font* is produced by nanoemoji, which is a specialised COLRv1
 * compiler. Reimplementing that in TypeScript would be a large amount of
 * fragile code for no benefit, so `icons` validates and reports instead, and
 * `npm run build:icon-font` shells out to nanoemoji. See CONTRIBUTING.md.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAllThemes, loadThemeSources, serializeTheme } from '../src/themes.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PATHS = {
  lightScheme: join(ROOT, 'src/gtksourceview/adwaita.xml'),
  darkScheme: join(ROOT, 'src/gtksourceview/adwaita-dark.xml'),
  defaultThemes: join(ROOT, 'src/default-themes/vscode-defaults.json'),
  themes: join(ROOT, 'themes'),
  icons: join(ROOT, 'icons'),
};

interface Report {
  ok: boolean;
  messages: string[];
}

function report(ok: boolean, ...messages: string[]): Report {
  return { ok, messages };
}

async function buildThemes(): Promise<Report> {
  const sources = await loadThemeSources(PATHS);
  const themes = buildAllThemes(sources);

  await mkdir(PATHS.themes, { recursive: true });

  const lines: string[] = [];
  for (const theme of themes) {
    const target = join(PATHS.themes, theme.fileName);
    await writeFile(target, serializeTheme(theme), 'utf8');
    lines.push(
      `  ${theme.fileName.padEnd(56)} ` +
        `${theme.definition.variant.padEnd(5)} ` +
        `${theme.definition.syntaxSource.padEnd(9)} ` +
        `${Object.keys(theme.colors).length} colours, ` +
        `${theme.tokenColors.length} token rules`,
    );
  }

  console.log(`Built ${themes.length} colour themes into themes/`);
  for (const line of lines) console.log(line);
  return report(true);
}

async function buildIcons(): Promise<Report> {
  const { validateIcons } = await import('./icon-support.ts');
  return validateIcons(PATHS.icons);
}

async function main(): Promise<void> {
  const target = process.argv[2] ?? 'all';

  const tasks: Array<[string, () => Promise<Report>]> = [];
  if (target === 'themes' || target === 'all') tasks.push(['themes', buildThemes]);
  if (target === 'icons' || target === 'all') tasks.push(['icons', buildIcons]);

  if (tasks.length === 0) {
    console.error(`Unknown build target "${target}". Use "themes", "icons" or "all".`);
    process.exitCode = 1;
    return;
  }

  const results: Report[] = [];
  for (const [name, task] of tasks) {
    console.log(`\n==> ${name}`);
    const result = await task();
    for (const message of result.messages) console.log(message);
    if (!result.ok) process.exitCode = 1;
    results.push(result);
  }

  if (results.some((result) => !result.ok)) {
    console.error('\nBuild finished with errors.');
    process.exitCode = 1;
  } else {
    console.log('\nBuild finished successfully.');
  }
}

await main();
