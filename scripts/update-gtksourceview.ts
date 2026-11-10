#!/usr/bin/env bun
/**
 * Refresh the vendored GtkSourceView style schemes from upstream master.
 *
 *   bun run update:gtksourceview
 *
 * The schemes are the source of GNOME Builder's syntax highlighting, so they
 * are vendored rather than fetched at build time: a build must not depend on
 * the network, and an upstream change should be reviewed before it lands.
 *
 * After updating, run `bun run build:themes` and inspect the diff. If a style
 * was renamed or removed, `build.ts` fails with a clear message and
 * `src/scopes.ts` needs updating.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseStyleScheme } from '../src/style-scheme.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BASE_URL = 'https://gitlab.gnome.org/GNOME/gtksourceview/-/raw/master/data/styles';

const SCHEMES = [
  { file: 'adwaita.xml', variant: 'light' as const },
  { file: 'adwaita-dark.xml', variant: 'dark' as const },
];

const UPSTREAM_LICENSE = `<!--

  Copyright 2020 Christian Hergert <christian@hergert.me>

  GtkSourceView is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 2.1 of the License, or (at your option) any later version.

  GtkSourceView is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this library; if not, see <http://www.gnu.org/licenses/>.

  Vendored from ${BASE_URL}/
-->

`;

async function updateScheme(file: string, variant: 'light' | 'dark'): Promise<void> {
  const url = `${BASE_URL}/${file}`;
  process.stdout.write(`fetching ${url} ... `);

  const response = await fetch(url, {
    headers: { 'user-agent': 'vsc-adwaita-next build script' },
  });
  if (!response.ok) {
    throw new Error(`request failed with ${response.status} ${response.statusText}`);
  }

  const source = await response.text();

  // Parse first so a broken or renamed scheme fails before we write anything.
  const scheme = parseStyleScheme(source, variant);
  const styleCount = Object.keys(scheme.styles).length;

  const body = source.replace(/^<\?xml[^>]*\?>\s*/, '').replace(/^\s*<!--[\s\S]*?-->\s*/, '');
  const output = `<?xml version="1.0" encoding="UTF-8"?>\n${UPSTREAM_LICENSE}${body.trim()}\n`;

  const target = join(ROOT, 'src/gtksourceview', file);
  await writeFile(target, output, 'utf8');
  console.log(`ok (${styleCount} styles, variant ${scheme.variant})`);
}

async function main(): Promise<void> {
  try {
    for (const scheme of SCHEMES) {
      await updateScheme(scheme.file, scheme.variant);
    }
    console.log('\nSchemes updated. Now run `bun run build:themes` and review the diff.');
  } catch (error) {
    console.error(`\nUpdate failed: ${(error as Error).message}`);
    process.exitCode = 1;
  }
}

await main();
