# Syntax highlighting samples

Each file in this directory exercises one language family or one theme feature.
Open a file, switch between **Adwaita Dark** and **Adwaita Light**, and compare.

These files are for visual QA only. They are excluded from the published
extension by `.vscodeignore`.

| File                 | Covers                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `01-typescript.ts`   | Comments, JSDoc, keywords, types, interfaces, enums, generics, decorators, classes, template literals, numbers, operators |
| `02-tsx.tsx`         | JSX element and attribute names, attribute values, embedded expressions, expression containers                            |
| `03-rust.rs`         | Attributes, lifetimes, macros, traits, impl blocks, pattern matching, raw strings, char literals                          |
| `04-python.py`       | Shebang, docstrings, decorators, f-strings, builtins, class names, import handlers, type hints                            |
| `05-go.go`           | Predeclared types, printf placeholders, struct tags, generics, channels, goroutines                                       |
| `06-c.c`             | Preprocessor, storage classes, type keywords, printf placeholders, numeric bases                                          |
| `07-cpp.cpp`         | Namespaces, templates, lambdas, references, raw strings, operator overloading                                             |
| `08-java.java`       | Annotations, generics, records, sealed types, switch expressions, text blocks                                             |
| `09-kotlin.kt`       | Data classes, coroutines, extension functions, null safety, when expressions                                              |
| `10-csharp.cs`       | Preprocessor directives, nullable reference types, records, pattern matching, verbatim strings                            |
| `11-ruby.rb`         | Shebang, symbols, heredocs, blocks, modules, metaprogramming, regexp                                                      |
| `12-php.php`         | Attributes, traits, enums, match expressions, heredoc, string interpolation                                               |
| `13-swift.swift`     | Optionals, protocols, generics, property wrappers, associated values, async                                               |
| `14-dart.dart`       | Null safety, mixins, extension methods, records, sealed classes, cascades                                                 |
| `15-bash.sh`         | Shebang, variable expansion, command substitution, arithmetic, loops, case                                                |
| `16-html.html`       | Doctype, comments, element and attribute names, boolean and data attributes                                               |
| `17-xml.xml`         | Declaration, processing instructions, namespaces, CDATA, entities                                                         |
| `18-css.css`         | Selectors, custom properties, at-rules, vendor prefixes, colour functions                                                 |
| `19-scss.scss`       | Nesting, mixins, functions, control directives, interpolation, parent selectors                                           |
| `20-less.less`       | Mixins with guards, operations, interpolation, escaping, importing                                                        |
| `21-json.json`       | Objects, arrays, numbers, booleans, null, escapes                                                                         |
| `22-jsonc.jsonc`     | Comments, trailing commas, nested objects, the settings keys VS Code reads                                                |
| `23-yaml.yaml`       | Keys as tag names, anchors and aliases, block scalars, flow collections, document markers                                 |
| `24-toml.toml`       | Tables, arrays of tables, inline tables, dotted keys, dates and times                                                     |
| `25-markdown.md`     | Headings, emphasis, strong emphasis, strikethrough, lists, links, alerts, inline code, fenced code                        |
| `26-sql.sql`         | DDL, DML, joins, window functions, CTEs, aliases                                                                          |
| `27-graphql.graphql` | Schema definitions, queries, mutations, fragments, directives                                                             |
| `28-dockerfile`      | Instructions, arguments, environment variables, JSON array form, multi-stage                                              |
| `29-nix.nix`         | Attribute sets, let-in, functions, with, derivations, interpolation                                                       |
| `30-lua.lua`         | Tables, metatables, closures, varargs, string patterns                                                                    |
| `31-zig.zig`         | Comptime, error unions, optionals, tagged unions, defer, multiline strings                                                |
| `32-diff.diff`       | Added, removed and changed lines, headers, hunks, renames                                                                 |

## What to look for

- **Light and dark are polished independently.** Do not assume one is the
  inverse of the other.
- **Surface hierarchy.** In dark style the editor is darker than the chrome
  around it; in light style it is the opposite. Borders are a tint of the
  foreground over the surface.
- **Contrast.** Foregrounds clear WCAG AA for body text. Line numbers are held
  to 3:1 because they are non-essential.
- **Semantic tokens.** In TypeScript, Rust, Go, Python and other languages with
  a language server, colours come from `semanticTokenColors`. They deliberately
  match the TextMate rules, so a file looks the same either way.
- **Syntax colours.** Comments grey, keywords orange, types and strings teal,
  numbers and constants violet, escapes red, decorators and preprocessor orange.
