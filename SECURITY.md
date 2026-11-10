# Security Policy

## Supported versions

VSC Adwaita Next is a theme extension with no runtime code, so there is no
attack surface beyond the assets the editor loads. Security fixes are applied to
the latest released version only.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | Yes       |
| Earlier | No        |

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Instead, use GitHub's private vulnerability reporting for this repository:
**Security > Report a vulnerability**. Include:

- what you found,
- how to reproduce it,
- which editor and version you used,
- what you expected to happen.

You will get an acknowledgement within a reasonable time, and a fix or a clear
explanation of why it is not a vulnerability.

## Scope

In scope:

- Malicious or unexpected content in the theme JSON, product icon manifest, icon
  font or SVG assets.
- Build or release automation that could produce a tampered artifact.
- Supply chain problems in the dependency tree.

Out of scope:

- Vulnerabilities in VS Code, VSCodium or Code - OSS itself. Report those to the
  respective upstream project.
- Vulnerabilities in third-party CSS loaders or desktop integration tools that
  this project does not use or recommend for its own operation.
- Visual differences from upstream GNOME software.

## Supply chain

The project keeps its dependency tree deliberately small:

- `typescript` and `@types/node` for type checking.
- `@biomejs/biome` for formatting and linting.
- `@vscode/vsce` for packaging.
- `bun` and `@types/bun` as the script runtime.

There are no runtime dependencies. The published extension contains only JSON,
TTF, PNG and SVG assets.

Release workflows authenticate with GitHub secrets, never with committed
credentials, and are triggered only by version tags or an explicit manual
dispatch. Pushes to `main` never publish.
