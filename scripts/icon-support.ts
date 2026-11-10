/**
 * Product icon theme support: validation and codepoint verification.
 *
 * The icon font itself is compiled by nanoemoji (see CONTRIBUTING.md). What
 * this module adds is the part that is easy to get wrong and impossible to see:
 * it reads the font's `cmap` table and proves that every glyph the icon theme
 * manifest asks for actually exists at the codepoint the manifest claims.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface IconDefinition {
  fontCharacter: string;
  fontId: string;
}

export interface IconFont {
  id: string;
  src: Array<{ path: string; format: string }>;
  weight?: string;
  style?: string;
}

export interface ProductIconTheme {
  fonts: IconFont[];
  iconDefinitions: Record<string, IconDefinition>;
}

export interface IconValidationReport {
  ok: boolean;
  messages: string[];
  /** Codepoint to glyph name, for reporting. */
  codepoints: Map<number, string>;
}

const REQUIRED_FONT_FORMAT = /^(truetype|opentype|woff2?|embedded-opentype)$/i;

/** Parse the `cmap` table of a TrueType/OpenType font and return its mappings. */
export function readCmap(font: Uint8Array): Map<number, string> {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);

  const numTables = view.getUint16(4);
  let cmapOffset = -1;
  for (let index = 0; index < numTables; index += 1) {
    const record = 12 + index * 16;
    const tag = String.fromCharCode(
      view.getUint8(record),
      view.getUint8(record + 1),
      view.getUint8(record + 2),
      view.getUint8(record + 3),
    );
    if (tag === 'cmap') {
      cmapOffset = view.getUint32(record + 8);
      break;
    }
  }

  if (cmapOffset === -1) {
    throw new Error('Font has no cmap table');
  }

  const mappings = new Map<number, string>();
  const subtables = view.getUint16(cmapOffset + 2);

  for (let index = 0; index < subtables; index += 1) {
    const record = cmapOffset + 4 + index * 8;
    const offset = view.getUint32(record + 4);
    parseSubtable(view, cmapOffset + offset, mappings);
  }

  return mappings;
}

function parseSubtable(view: DataView, offset: number, mappings: Map<number, string>): void {
  const format = view.getUint16(offset);

  if (format === 4) {
    const segCountX2 = view.getUint16(offset + 6);
    const segCount = segCountX2 / 2;
    const endCodes = offset + 14;
    const startCodes = endCodes + segCountX2 + 2;
    const idDelta = startCodes + segCountX2;

    for (let segment = 0; segment < segCount; segment += 1) {
      const end = view.getUint16(endCodes + segment * 2);
      const start = view.getUint16(startCodes + segment * 2);
      const delta = view.getUint16(idDelta + segment * 2);
      if (start === 0xffff) continue;
      for (let codepoint = start; codepoint <= end && codepoint !== 0xffff; codepoint += 1) {
        if (mappings.has(codepoint)) continue;
        const glyph = (codepoint + delta) & 0xffff;
        mappings.set(codepoint, `glyph ${glyph}`);
        if (end - start > 0x2000) break; // guard against malformed tables
      }
    }
    return;
  }

  if (format === 12) {
    const groups = view.getUint32(offset + 12);
    const base = offset + 16;
    for (let group = 0; group < groups; group += 1) {
      const record = base + group * 12;
      const start = view.getUint32(record);
      const end = view.getUint32(record + 4);
      const glyph = view.getUint32(record + 8);
      for (let codepoint = start; codepoint <= end; codepoint += 1) {
        if (!mappings.has(codepoint)) {
          mappings.set(codepoint, `glyph ${glyph + (codepoint - start)}`);
        }
      }
    }
    return;
  }

  if (format === 6 || format === 0) {
    // Trimmed table mapping and byte encoding table; both map a small range.
    const first = view.getUint16(offset + 6);
    const count = view.getUint16(offset + 8);
    for (let index = 0; index < count; index += 1) {
      mappings.set(first + index, `glyph ${view.getUint8(offset + 10 + index)}`);
    }
  }
}

function parseFontCharacter(value: string): number {
  // VS Code builds fontCharacter as "\\" + codepoint.toString(16), so a JSON
  // value of "\\ea01" is the seven character string `\ea01`.
  const match = /^\\([0-9a-f]{4,6})$/i.exec(value.trim());
  const digits = match?.[1];
  if (digits === undefined) {
    throw new Error(`Invalid fontCharacter "${value}", expected \\uXXXX style such as \\ea01`);
  }
  return parseInt(digits, 16);
}

/** Validate an icon theme directory and cross-check it against its font. */
export async function validateIcons(iconsDir: string): Promise<IconValidationReport> {
  const messages: string[] = [];
  const codepoints = new Map<number, string>();
  let ok = true;

  const manifestPath = join(iconsDir, 'adwaita.json');
  let manifest: ProductIconTheme;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ProductIconTheme;
  } catch (error) {
    return {
      ok: false,
      codepoints,
      messages: [`  ${manifestPath}: ${(error as Error).message}`],
    };
  }

  if (!Array.isArray(manifest.fonts) || manifest.fonts.length === 0) {
    return { ok: false, codepoints, messages: ['  manifest declares no fonts'] };
  }
  if (typeof manifest.iconDefinitions !== 'object' || manifest.iconDefinitions === null) {
    return { ok: false, codepoints, messages: ['  manifest has no iconDefinitions object'] };
  }

  const fontIds = new Set<string>();
  for (const font of manifest.fonts) {
    if (!font.id) {
      ok = false;
      messages.push('  a font declaration is missing its id');
      continue;
    }
    fontIds.add(font.id);

    if (!Array.isArray(font.src) || font.src.length === 0) {
      ok = false;
      messages.push(`  font "${font.id}" declares no sources`);
      continue;
    }

    for (const source of font.src) {
      if (!REQUIRED_FONT_FORMAT.test(source.format)) {
        ok = false;
        messages.push(`  font "${font.id}" declares unsupported format "${source.format}"`);
      }
      const fontPath = join(iconsDir, source.path);
      try {
        const bytes = new Uint8Array(await readFile(fontPath));
        // TrueType is 0x00010000 big endian, CFF outlines are "OTTO".
        const isTrueType = bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0;
        const isCff =
          bytes[0] === 0x4f && bytes[1] === 0x54 && bytes[2] === 0x54 && bytes[3] === 0x4f;
        if (!isTrueType && !isCff) {
          const signature = String.fromCharCode(...bytes.slice(0, 4)).replace(/[^\x20-\x7e]/g, '?');
          throw new Error(`not an sfnt font (signature "${signature}")`);
        }
        const fontCodepoints = readCmap(bytes);
        for (const [codepoint, glyph] of fontCodepoints) {
          codepoints.set(codepoint, glyph);
        }
        messages.push(
          `  font "${font.id}" at ${source.path}: ${fontCodepoints.size} mapped codepoints`,
        );
      } catch (error) {
        ok = false;
        messages.push(`  font "${font.id}" at ${source.path}: ${(error as Error).message}`);
      }
    }
  }

  const seen = new Map<number, string>();
  for (const [iconId, definition] of Object.entries(manifest.iconDefinitions)) {
    if (!fontIds.has(definition.fontId)) {
      ok = false;
      messages.push(`  icon "${iconId}" references unknown font "${definition.fontId}"`);
      continue;
    }

    let codepoint: number;
    try {
      codepoint = parseFontCharacter(definition.fontCharacter);
    } catch (error) {
      ok = false;
      messages.push(`  icon "${iconId}": ${(error as Error).message}`);
      continue;
    }

    if (!codepoints.has(codepoint)) {
      ok = false;
      messages.push(
        `  icon "${iconId}" maps to U+${codepoint.toString(16).toUpperCase().padStart(4, '0')} ` +
          `but the font has no glyph there`,
      );
      continue;
    }

    const existing = seen.get(codepoint);
    if (existing !== undefined) {
      ok = false;
      messages.push(
        `  icons "${existing}" and "${iconId}" share codepoint U+${codepoint.toString(16)}`,
      );
      continue;
    }
    seen.set(codepoint, iconId);
  }

  // Every glyph in the font should be reachable, otherwise the font carries
  // dead weight and someone will eventually map an icon to the wrong glyph.
  const used = new Set([...seen.keys()]);
  for (const codepoint of codepoints.keys()) {
    if (codepoint === 0x20) continue; // nanoemoji always emits a space glyph
    if (!used.has(codepoint)) {
      messages.push(
        `  note: font maps U+${codepoint.toString(16).toUpperCase().padStart(4, '0')} ` +
          `but no icon definition uses it`,
      );
    }
  }

  // SVG sources should exist for every icon, in a predictable place.
  const svgDir = join(iconsDir, 'svg');
  let svgFiles: string[] = [];
  try {
    svgFiles = (await readdir(svgDir)).filter((name) => name.endsWith('.svg')).sort();
  } catch {
    messages.push('  note: icons/svg/ contains no SVG sources');
  }

  if (svgFiles.length > 0) {
    const expected = [...used]
      .map((codepoint) => `${codepoint.toString(16).padStart(4, '0')}.svg`)
      .sort();
    const missing = expected.filter((name) => !svgFiles.includes(name));
    if (missing.length > 0) {
      ok = false;
      messages.push(`  missing SVG sources: ${missing.join(', ')}`);
    }
    messages.push(`  ${svgFiles.length} SVG sources, ${used.size} icons referenced`);
  }

  messages.unshift(`  ${used.size} icon definitions, all codepoints resolve`);

  return { ok, messages, codepoints };
}
