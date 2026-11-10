/**
 * Adwaita design tokens.
 *
 * Values are taken from libadwaita 1.10.0 (the version shipped with GTK 4.24)
 * and from the GtkSourceView "Adwaita" style schemes, which are the source of
 * GNOME Builder's syntax highlighting.
 *
 * Provenance:
 *   - Palette (`blue_1` .. `dark_7`, `teal_*`, `violet_*`, `chameleon_3`) and the
 *     GtkSourceView style schemes: GNOME gtksourceview, `data/styles/Adwaita*.xml`,
 *     Copyright (C) Christian Hergert, LGPL-2.1-or-later. Refreshed from upstream
 *     master by `npm run update:gtksourceview`.
 *   - Semantic surface and accent tokens: libadwaita 1.10.0 `_defaults.scss` /
 *     `_common.scss`, LGPL-2.1-or-later.
 *
 * Both upstream projects are free software; this derived token table keeps the
 * original attribution above.
 */

export type ThemeVariant = 'light' | 'dark';

/**
 * The Adwaita named palette. Shared between both variants except for the
 * `dark_*` ramp, which GtkSourceView redefines for its dark scheme. The scheme
 * files themselves are the authoritative source; this table documents the
 * shared part and is used for icon artwork and documentation.
 */
export const ADWAITA_PALETTE = {
  blue_1: '#99c1f1',
  blue_2: '#62a0ea',
  blue_3: '#3584e4',
  blue_4: '#1c71d8',
  blue_5: '#1a5fb4',
  blue_6: '#1b497e',
  blue_7: '#193d66',
  brown_1: '#cdab8f',
  brown_2: '#b5835a',
  brown_3: '#986a44',
  brown_4: '#865e3c',
  brown_5: '#63452c',
  chameleon_3: '#4e9a06',
  green_1: '#8ff0a4',
  green_2: '#57e389',
  green_3: '#33d17a',
  green_4: '#2ec27e',
  green_5: '#26a269',
  green_6: '#1f7f56',
  green_7: '#1c6849',
  light_1: '#ffffff',
  light_2: '#fcfcfc',
  light_3: '#f6f5f4',
  light_4: '#deddda',
  light_5: '#c0bfbc',
  light_6: '#b0afac',
  light_7: '#9a9996',
  orange_1: '#ffbe6f',
  orange_2: '#ffa348',
  orange_3: '#ff7800',
  orange_4: '#e66100',
  orange_5: '#c64600',
  purple_1: '#dc8add',
  purple_2: '#c061cb',
  purple_3: '#9141ac',
  purple_4: '#813d9c',
  purple_5: '#613583',
  red_1: '#f66151',
  red_2: '#ed333b',
  red_3: '#e01b24',
  red_4: '#c01c28',
  red_5: '#a51d2d',
  teal_1: '#93ddc2',
  teal_2: '#5bc8af',
  teal_3: '#33b2a4',
  teal_4: '#26a1a2',
  teal_5: '#218787',
  violet_2: '#7d8ac7',
  violet_3: '#6362c8',
  violet_4: '#4e57ba',
  yellow_1: '#f9f06b',
  yellow_2: '#f8e45c',
  yellow_3: '#f6d32d',
  yellow_4: '#f5c211',
  yellow_5: '#e5a50a',
  yellow_6: '#d38b09',
} as const;

/**
 * The `dark_*` ramp is the one part of the palette that GtkSourceView
 * redefines per variant: the light scheme uses the cool purple-grey ramp while
 * the dark scheme uses a neutral grey ramp that matches libadwaita's dark
 * surfaces. It therefore lives outside the shared palette.
 */
export const ADWAITA_DARK_RAMP: Record<ThemeVariant, Record<number, string>> = {
  light: {
    1: '#77767b',
    2: '#5e5c64',
    3: '#504e55',
    4: '#3d3846',
    5: '#241f31',
    6: '#000000',
  },
  dark: {
    1: '#777777',
    2: '#5e5e5e',
    3: '#505050',
    4: '#3d3d3d',
    5: '#242424',
    6: '#121212',
    7: '#000000',
  },
};

/** Semantic surface tokens as defined by libadwaita. */
export interface AdwaitaSurfaces {
  windowBg: string;
  viewBg: string;
  headerbarBg: string;
  sidebarBg: string;
  sidebarBackdrop: string;
  secondarySidebarBg: string;
  cardBg: string;
  dialogBg: string;
  popoverBg: string;
  thumbnailBg: string;
  windowFg: string;
  viewFg: string;
  headerbarFg: string;
  sidebarFg: string;
  cardFg: string;
  dialogFg: string;
  popoverFg: string;
  accentBg: string;
  accentFg: string;
  destructiveBg: string;
  destructiveFg: string;
  successBg: string;
  successFg: string;
  warningBg: string;
  warningFg: string;
  errorBg: string;
  errorFg: string;
}

const ACCENT_BLUE = ADWAITA_PALETTE.blue_3;

/**
 * libadwaita semantic tokens, verbatim from the 1.10.0 stylesheet.
 *
 * Foregrounds in libadwaita are a colour plus an opacity
 * (`window_fg_color: RGB(0 0 6 / 80%)` in light style, plain `white` in dark
 * style). VS Code colour keys take no independent text alpha, so each
 * foreground below is the libadwaita foreground already composited over its own
 * surface. That keeps the effective contrast identical to the GTK original.
 */
export const ADWAITA_SURFACES: Record<ThemeVariant, AdwaitaSurfaces> = {
  light: {
    windowBg: '#fafafb',
    viewBg: '#ffffff',
    headerbarBg: '#ffffff',
    sidebarBg: '#ebebed',
    sidebarBackdrop: '#f2f2f4',
    secondarySidebarBg: '#f3f3f5',
    cardBg: '#ffffff',
    dialogBg: '#fafafb',
    popoverBg: '#ffffff',
    thumbnailBg: '#ffffff',
    windowFg: '#323237',
    viewFg: '#333338',
    headerbarFg: '#333338',
    sidebarFg: '#2f2f34',
    cardFg: '#333338',
    dialogFg: '#323237',
    popoverFg: '#333338',
    accentBg: ACCENT_BLUE,
    accentFg: '#ffffff',
    destructiveBg: ADWAITA_PALETTE.red_3,
    destructiveFg: '#ffffff',
    successBg: ADWAITA_PALETTE.green_4,
    successFg: '#ffffff',
    warningBg: ADWAITA_PALETTE.yellow_5,
    warningFg: '#332600',
    errorBg: ADWAITA_PALETTE.red_3,
    errorFg: '#ffffff',
  },
  dark: {
    windowBg: '#222226',
    viewBg: '#1d1d20',
    headerbarBg: '#2e2e32',
    sidebarBg: '#2e2e32',
    sidebarBackdrop: '#28282c',
    secondarySidebarBg: '#28282c',
    cardBg: '#2f2f33',
    dialogBg: '#36363a',
    popoverBg: '#36363a',
    thumbnailBg: '#39393d',
    windowFg: '#ffffff',
    viewFg: '#ffffff',
    headerbarFg: '#ffffff',
    sidebarFg: '#ffffff',
    cardFg: '#ffffff',
    dialogFg: '#ffffff',
    popoverFg: '#ffffff',
    accentBg: ACCENT_BLUE,
    accentFg: '#ffffff',
    destructiveBg: ADWAITA_PALETTE.red_4,
    destructiveFg: '#ffffff',
    successBg: ADWAITA_PALETTE.green_5,
    successFg: '#ffffff',
    warningBg: '#cd9309',
    warningFg: '#ffffff',
    errorBg: ADWAITA_PALETTE.red_4,
    errorFg: '#ffffff',
  },
};
