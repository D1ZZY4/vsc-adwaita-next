/**
 * Tests for the colour primitives.
 *
 * Run with `bun test tests/`.
 */

import { describe, expect, it } from 'bun:test';

import {
  contrastRatio,
  deriveAccentColor,
  hexToRgb,
  mix,
  normalizeHex,
  oklabToHex,
  relativeLuminance,
  srgbToOklab,
  withAlpha,
} from '../src/color.ts';

describe('normalizeHex', () => {
  it('expands shorthand to eight digits', () => {
    expect(normalizeHex('#abc')).toBe('#aabbccff');
  });

  it('appends an opaque alpha channel', () => {
    expect(normalizeHex('#3584E4')).toBe('#3584e4ff');
  });

  it('preserves an explicit alpha channel', () => {
    expect(normalizeHex('#3584e480')).toBe('#3584e480');
  });

  it('rejects anything that is not a hex colour', () => {
    expect(() => normalizeHex('rgb(1,2,3)')).toThrow();
    expect(() => normalizeHex('#12345')).toThrow();
    expect(() => normalizeHex('#gggggg')).toThrow();
  });
});

describe('hexToRgb', () => {
  it('splits channels and alpha', () => {
    expect(hexToRgb('#3584e4')).toEqual({ r: 0x35, g: 0x84, b: 0xe4, alpha: 1 });
    expect(hexToRgb('#00000000')).toEqual({ r: 0, g: 0, b: 0, alpha: 0 });
  });
});

describe('withAlpha', () => {
  it('keeps the colour and replaces the opacity', () => {
    expect(withAlpha('#3584e4', 0.5)).toBe('#3584e480');
    expect(withAlpha('#3584e4', 1)).toBe('#3584e4ff');
  });

  it('clamps out of range alpha', () => {
    expect(withAlpha('#3584e4', 2)).toBe('#3584e4ff');
    expect(withAlpha('#3584e4', -1)).toBe('#3584e400');
  });
});

describe('oklab conversion', () => {
  it('round trips through sRGB', () => {
    for (const hex of ['#3584e4', '#ffffff', '#000000', '#33d17a', '#ff7800', '#1d1d20']) {
      const back = oklabToHex(srgbToOklab(hex));
      const original = hexToRgb(hex);
      const result = hexToRgb(back);
      expect(Math.abs(result.r - original.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.g - original.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(result.b - original.b)).toBeLessThanOrEqual(1);
    }
  });
});

describe('deriveAccentColor', () => {
  // libadwaita derives accent_color with
  //   oklab(from <bg> min(l, 0.5) a b)   in light style
  //   oklab(from <bg> max(l, 0.85) a b)  in dark style
  it('darkens the accent for light style and lightens it for dark style', () => {
    const light = deriveAccentColor('#3584e4', false);
    const dark = deriveAccentColor('#3584e4', true);
    expect(relativeLuminance(light)).toBeLessThan(relativeLuminance('#3584e4'));
    expect(relativeLuminance(dark)).toBeGreaterThan(relativeLuminance('#3584e4'));
  });

  it('is deterministic', () => {
    expect(deriveAccentColor('#3584e4', false)).toBe(deriveAccentColor('#3584e4', false));
  });
});

describe('contrastRatio', () => {
  it('is 21 between black and white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('is 1 for identical colours', () => {
    expect(contrastRatio('#3584e4', '#3584e4')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(
      contrastRatio('#ffffff', '#000000'),
      10,
    );
  });
});

describe('relativeLuminance', () => {
  it('orders colours as expected', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#3584e4')).toBeGreaterThan(relativeLuminance('#1d1d20'));
  });
});

describe('mix', () => {
  it('returns the endpoints at 0 and 1', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000ff');
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffffff');
  });

  it('interpolates linearly', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080ff');
  });

  it('clamps out of range amounts', () => {
    expect(mix('#000000', '#ffffff', -1)).toBe('#000000ff');
    expect(mix('#000000', '#ffffff', 2)).toBe('#ffffffff');
  });
});
