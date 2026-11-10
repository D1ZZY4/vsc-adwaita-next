#!/usr/bin/env bun
/**
 * Package the extension into a VSIX.
 *
 *   bun run package
 *   VSC_ADWAITA_PUBLISHER=my-publisher bun run package
 *
 * `@vscode/vsce` is the maintained packaging tool. The publisher in
 * package.json is a placeholder: replace it with the real namespace before
 * publishing, or pass one through the environment.
 *
 * Nothing is ever published from here. Publishing needs a registered
 * publisher and a token, both of which live outside this repository.
 */

import { $ } from 'bun';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PLACEHOLDER_PUBLISHER = 'vsc-adwaita-next';

interface Manifest {
  name?: unknown;
  publisher?: unknown;
  version?: unknown;
}

async function main(): Promise<void> {
  const manifestPath = join(ROOT, 'package.json');
  const manifest = (await Bun.file(manifestPath).json()) as Manifest;

  if (manifest.publisher === PLACEHOLDER_PUBLISHER) {
    console.warn(
      `\nNote: publisher is still the placeholder "${PLACEHOLDER_PUBLISHER}".\n` +
        'Replace it in package.json, or set VSC_ADWAITA_PUBLISHER, before publishing.\n',
    );
  }

  const publisher = process.env.VSC_ADWAITA_PUBLISHER;
  if (publisher !== undefined && publisher !== '') {
    await Bun.write(manifestPath, `${JSON.stringify({ ...manifest, publisher }, null, 2)}\n`);
    console.log(`Using publisher "${publisher}" from VSC_ADWAITA_PUBLISHER.`);
  }

  // `--no-dependencies` keeps the VSIX to the theme assets only: the
  // devDependencies are build tools and must not ship.
  const outDir = join(ROOT, 'dist');
  await mkdir(outDir, { recursive: true });
  await $`bunx --bun @vscode/vsce package --no-dependencies --out ${outDir}`.cwd(ROOT);
}

await main();
