/**
 * Workbench colour tokens.
 *
 * This module is the single source of truth for how Adwaita's design language
 * maps onto VS Code's workbench colour keys. It is deliberately expressed as
 * "derive a set of semantic tokens, then place them on VS Code keys" rather
 * than a flat list of hex literals: both variants share the placement logic and
 * differ only in the token values they receive, which is what keeps the light
 * and dark themes coherent.
 *
 * Surface hierarchy follows libadwaita:
 *
 *   view (editor)  <  window  <  sidebar backdrop  <  sidebar / headerbar
 *                 <  card  <  dialog / popover  <  thumbnail
 *
 * In dark style the content view is *darker* than the chrome around it, which
 * is how libadwaita signals a recessed content area. Borders are a low opacity
 * tint of the foreground over the surface, exactly as libadwaita derives
 * `*_border_color` from `*_fg_color`.
 */

import {
  ADWAITA_DARK_RAMP,
  ADWAITA_PALETTE,
  ADWAITA_SURFACES,
  type AdwaitaSurfaces,
  type ThemeVariant,
} from './adwaita.ts';
import { deriveAccentColor, mix, withAlpha } from './color.ts';

/** Semantic tokens that the workbench colour map is built from. */
export interface WorkbenchTokens {
  variant: ThemeVariant;

  // Surfaces, lowest to highest elevation.
  editorBg: string;
  windowBg: string;
  panelBg: string;
  sidebarBg: string;
  sidebarBackdropBg: string;
  secondarySidebarBg: string;
  headerbarBg: string;
  tabStripBg: string;
  tabActiveBg: string;
  tabInactiveBg: string;
  overlayBg: string;
  inputBg: string;
  hoverBg: string;
  activeBg: string;
  selectedBg: string;

  // Foregrounds.
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  fgStrong: string;
  fgOnAccent: string;

  // Accents and status.
  accentBg: string;
  accentHoverBg: string;
  accentColor: string;
  focusBorder: string;
  destructiveBg: string;
  successBg: string;
  warningBg: string;
  warningColor: string;
  errorBg: string;
  errorColor: string;
  infoBg: string;

  // Lines.
  border: string;
  borderStrong: string;
  borderSubtle: string;

  // Editor internals.
  selectionBg: string;
  selectionInactiveBg: string;
  findMatchBg: string;
  findMatchHighlightBg: string;
  wordHighlightBg: string;
  lineHighlightBg: string;
  indentGuideBg: string;
  indentGuideActiveBg: string;
  bracketMatchBg: string;
  cursorFg: string;
  lineNumberFg: string;
  lineNumberActiveFg: string;
  whitespaceFg: string;

  // Git decorations.
  gitAdded: string;
  gitModified: string;
  gitDeleted: string;
  gitRenamed: string;
  gitUntracked: string;
  gitIgnored: string;
  gitConflicting: string;
  gitSubmodule: string;

  // Terminal.
  terminalAnsi: string[];
}

function tint(surface: string, foreground: string, amount: number): string {
  return mix(surface, foreground, amount);
}

export function buildWorkbenchTokens(variant: ThemeVariant): WorkbenchTokens {
  const dark = variant === 'dark';
  const surfaces: AdwaitaSurfaces = ADWAITA_SURFACES[variant];
  const palette = ADWAITA_PALETTE;
  const darkRamp = (level: number): string => {
    const value = ADWAITA_DARK_RAMP[variant][level];
    if (value === undefined) {
      throw new Error(`The Adwaita dark ramp has no level ${level} for ${variant} style`);
    }
    return value;
  };

  const fg = surfaces.viewFg;
  const fgMuted = dark ? palette.light_4 : darkRamp(2);
  const fgSubtle = dark ? darkRamp(1) : palette.light_7;
  const fgStrong = dark ? palette.light_1 : darkRamp(4);

  const editorBg = surfaces.viewBg;
  const windowBg = surfaces.windowBg;
  const sidebarBg = surfaces.sidebarBg;
  const sidebarBackdropBg = surfaces.sidebarBackdrop;
  const headerbarBg = surfaces.headerbarBg;
  const overlayBg = surfaces.popoverBg;
  const inputBg = tint(windowBg, fg, dark ? 0.08 : 0.05);

  const accentBg = surfaces.accentBg;
  const accentColor = deriveAccentColor(accentBg, dark);
  // The focus ring uses `accent_bg_color`, not the oklab derived
  // `accent_color`. `accent_color` is deliberately pushed to a very light
  // lightness in dark style (max(l, 0.85)), which makes a pale, glaring
  // outline when VS Code draws it around a tab or an activity bar item on
  // click. `accent_bg_color` keeps the ring clearly visible at roughly 4:1
  // against every surface in the theme without shouting.
  const focusRing = accentBg;
  const destructiveBg = surfaces.destructiveBg;
  const successBg = surfaces.successBg;
  const warningBg = surfaces.warningBg;
  const warningColor = dark ? palette.yellow_2 : palette.yellow_6;
  const errorBg = surfaces.errorBg;
  const errorColor = dark ? palette.red_2 : palette.red_5;
  const infoBg = palette.blue_3;

  const terminalAnsi = dark
    ? [
        '#241f31', // black
        palette.red_2,
        palette.green_4,
        palette.yellow_4,
        palette.blue_2,
        palette.purple_2,
        palette.teal_2,
        palette.light_4,
        darkRamp(2), // bright black
        palette.red_1,
        palette.green_2,
        palette.yellow_2,
        palette.blue_1,
        palette.purple_1,
        palette.teal_1,
        palette.light_1, // bright white
      ]
    : [
        darkRamp(4), // black
        palette.red_4,
        palette.green_5,
        palette.yellow_5,
        palette.blue_5,
        palette.purple_5,
        palette.teal_5,
        palette.light_5,
        darkRamp(2), // bright black
        palette.red_3,
        palette.green_4,
        palette.yellow_4,
        palette.blue_4,
        palette.purple_4,
        palette.teal_4,
        darkRamp(1), // bright white
      ];

  return {
    variant,
    editorBg,
    windowBg,
    panelBg: surfaces.secondarySidebarBg,
    sidebarBg,
    sidebarBackdropBg,
    secondarySidebarBg: surfaces.secondarySidebarBg,
    headerbarBg,
    tabStripBg: headerbarBg,
    tabActiveBg: editorBg,
    tabInactiveBg: sidebarBackdropBg,
    overlayBg,
    inputBg,
    hoverBg: tint(sidebarBg, fg, dark ? 0.07 : 0.05),
    activeBg: tint(accentBg, fg, dark ? 0.1 : 0.0),
    selectedBg: tint(accentBg, fg, dark ? 0.16 : 0.12),

    fg,
    fgMuted,
    fgSubtle,
    fgStrong,
    fgOnAccent: surfaces.accentFg,

    accentBg,
    accentHoverBg: mix(accentBg, dark ? palette.light_1 : darkRamp(5), dark ? 0.18 : 0.14),
    accentColor,
    focusBorder: focusRing,
    destructiveBg,
    successBg,
    warningBg,
    warningColor,
    errorBg,
    errorColor,
    infoBg,

    border: tint(editorBg, fg, dark ? 0.1 : 0.11),
    borderStrong: tint(editorBg, fg, dark ? 0.2 : 0.22),
    borderSubtle: tint(editorBg, fg, dark ? 0.05 : 0.06),

    selectionBg: withAlpha(accentBg, dark ? 0.32 : 0.26),
    selectionInactiveBg: withAlpha(accentBg, dark ? 0.22 : 0.16),
    findMatchBg: withAlpha(palette.yellow_4, dark ? 0.4 : 0.5),
    findMatchHighlightBg: withAlpha(palette.yellow_4, dark ? 0.22 : 0.28),
    wordHighlightBg: withAlpha(palette.yellow_4, dark ? 0.18 : 0.22),
    lineHighlightBg: tint(editorBg, fg, dark ? 0.05 : 0.04),
    indentGuideBg: tint(editorBg, fg, dark ? 0.14 : 0.13),
    indentGuideActiveBg: tint(editorBg, fg, dark ? 0.3 : 0.28),
    bracketMatchBg: withAlpha(accentBg, dark ? 0.22 : 0.16),
    cursorFg: dark ? palette.light_1 : darkRamp(5),
    // Line numbers are non-essential text, so they only need the 3:1 WCAG
    // threshold for UI components. On white, Adwaita's light_7 (#9a9996) is
    // 2.85:1, so a slightly deeper neutral is used instead.
    lineNumberFg: dark ? darkRamp(1) : '#808080',
    lineNumberActiveFg: fgMuted,
    whitespaceFg: tint(editorBg, fg, dark ? 0.18 : 0.16),

    gitAdded: dark ? palette.green_2 : palette.green_5,
    gitModified: dark ? palette.yellow_3 : palette.orange_5,
    gitDeleted: dark ? palette.red_2 : palette.red_5,
    gitRenamed: dark ? palette.green_2 : palette.green_5,
    gitUntracked: dark ? palette.green_1 : palette.green_6,
    gitIgnored: fgSubtle,
    gitConflicting: dark ? palette.red_3 : palette.red_4,
    gitSubmodule: dark ? palette.purple_2 : palette.purple_4,

    terminalAnsi,
  };
}
