# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project is a fork of
[piousdeer/vscode-adwaita](https://github.com/piousdeer/vscode-adwaita). Version
1.0.0 is the first release under the VSC Adwaita Next name and does not share a
version lineage with upstream releases.

## [1.0.0] - 2026-11-10

First release of VSC Adwaita Next, a community maintained fork of
piousdeer/vscode-adwaita.

### Added

- A TypeScript-first build pipeline. Theme generation, validation and packaging
  are typed scripts run with Bun, replacing the Python build.
- Design tokens derived from libadwaita 1.10.0, including the semantic surface
  tokens (`window`, `view`, `sidebar`, `headerbar`, `card`, `dialog`, `popover`)
  and the oklab derived accent colour.
- Semantic token colours for the standard token types, so language servers colour
  code consistently with the TextMate rules.
- Full workbench colour coverage across activity bar, title bar, tabs, sidebar,
  editor, editor groups, status bar, panel, terminal, breadcrumbs, notifications,
  menus, quick input, search, source control, debugging, testing, diff editors,
  notebooks, chat and remote surfaces.
- `bun run validate`, which checks the manifest, every theme, every token value,
  contrast ratios, and the icon font's codepoints against the icon manifest.
- A test suite covering the colour maths, the XML and style scheme readers, the
  scope map invariants, and theme assembly.
- `bun run update:gtksourceview`, which refreshes the vendored GtkSourceView
  schemes from upstream master and fails loudly on a rename.
- `src/vscode-color-ids.json`, the list of colour keys VS Code registers, used to
  reject unsupported keys.
- GitHub Actions workflows for verification and tagged releases, plus issue
  templates, a pull request template and a security policy.
- An original extension icon with an SVG source of truth.

### Changed

- Design tokens refreshed against libadwaita 1.10.0 instead of the palette the
  upstream project used.
- Vendored GtkSourceView schemes refreshed from upstream master, picking up the
  `def:statement` rename, the new `def:identifier`, `def:emphasis`, `def:error`,
  `def:note` and `def:inline-code` styles, and the neutral dark surface ramp.
- Scope map extended to cover TypeScript, JavaScript, TSX, JSX, Rust, Python, Go,
  C, C++, Java, Kotlin, C#, Ruby, PHP, Swift, Dart, shell, Bash, Fish, HTML, XML,
  CSS, SCSS, Less, JSON, JSONC, YAML, TOML, Markdown, SQL, GraphQL, Dockerfiles,
  Nix, Lua and Zig.
- The "default syntax highlighting" variants now ship VS Code's current built-in
  Dark Plus and Light Plus token colours instead of a 1.65.2 snapshot.
- Product icon font rebuilt with `"format": "truetype"` to match the actual font.
- Workbench borders are now a tint of the foreground over the surface, matching
  how libadwaita derives `*_border_color`, instead of a flat grey.
- Line numbers use a deeper neutral in light style so they clear the 3:1 WCAG
  threshold for UI components.
- Repository restructured: sources in `src/`, tooling in `scripts/`, generated
  themes in `themes/`, icons in `icons/`, extension icon in `assets/`.

### Fixed

- Every generated theme declared `"type": "light"`, including the four dark
  variants. `type` now matches the variant.
- The GtkSourceView to TextMate conversion iterated over `'strikethorugh'`, a
  typo for `strikethrough`, so the attribute could never be applied. The
  conversion now emits `italic`, `bold`, `underline` and `strikethrough`
  correctly.
- `load_jsonc` stripped comments with a regular expression that would corrupt any
  JSON string containing `//`. Comments are no longer stripped at all: the
  default theme data is plain JSON.
- TextMate rules with an empty scope array were emitted as
  `{"scope": [], ...}`. They are now dropped.
- Duplicate scope selectors between `def:*` rules were removed.
- Unsupported VS Code colour keys that the previous theme emitted are gone; the
  build now fails on an unknown key.

### Removed

- The Python build scripts and the `__pycache__` ignore rule.
- The upstream screenshot assets and the GIMP source file.
- The manual "Suggested package.json entry" copy step. `package.json` is now
  validated against the generated variants instead.

### Security

- No credentials, tokens or secrets are stored in the repository. Release
  workflows use GitHub secrets and are triggered only by tags.

[1.0.0]: https://github.com/D1ZZY4/vsc-adwaita-next/releases/tag/v1.0.0
