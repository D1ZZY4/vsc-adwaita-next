/**
 * Color primitives and conversions used across the design token pipeline.
 *
 * Everything here is deterministic and side effect free so that theme
 * generation stays reproducible.
 */

export type Rgb = { r: number; g: number; b: number };
export type Oklab = { L: number; a: number; b: number };

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Normalise `#abc`, `#aabbcc` and `#aabbccdd` to 8 lowercase hex digits. */
export function normalizeHex(hex: string): string {
  const value = hex.trim();
  const match = HEX_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const digits = match[1];
  if (digits === undefined) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  if (digits.length === 3) {
    return `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}ff`;
  }
  if (digits.length === 6) {
    return `#${digits.toLowerCase()}ff`;
  }
  return `#${digits.toLowerCase()}`;
}

export function hexToRgb(hex: string): Rgb & { alpha: number } {
  const value = normalizeHex(hex);
  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16),
    alpha: parseInt(value.slice(7, 9), 16) / 255,
  };
}

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function rgbToHex(rgb: Rgb, alpha = 1): string {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) =>
    clampChannel(channel).toString(16).padStart(2, '0'),
  );
  const opacity = clampChannel(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${channels.join('')}${opacity}`;
}

/** Returns `#rrggbbaa`, combining a base color with an explicit opacity. */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r, g, b }, alpha);
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  const value = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
  return value * 255;
}

export function srgbToOklab(hex: string): Oklab {
  const { r, g, b } = hexToRgb(hex);
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = Math.cbrt(0.4122214707 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function oklabToHex(lab: Oklab): string {
  const { L, a, b } = lab;

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const rgb = {
    r: linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };

  return rgbToHex(rgb);
}

/**
 * libadwaita derives `accent_color` from `accent_bg_color` with
 * `oklab(from <bg> min(l, 0.5) a b)` in light style and
 * `oklab(from <bg> max(l, 0.85) a b)` in dark style.
 */
export function deriveAccentColor(accentBg: string, dark: boolean): string {
  const lab = srgbToOklab(accentBg);
  const lightness = dark ? Math.max(lab.L, 0.85) : Math.min(lab.L, 0.5);
  return oklabToHex({ L: lightness, a: lab.a, b: lab.b });
}

/** WCAG 2.1 relative luminance. Alpha is ignored; pass an opaque color. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** WCAG 2.1 contrast ratio between two opaque colors, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Blend two opaque colors in sRGB space. `amount` 0 returns `from`. */
export function mix(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const t = Math.min(1, Math.max(0, amount));
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}
