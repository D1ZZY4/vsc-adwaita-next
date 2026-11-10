/**
 * Mapping from GtkSourceView style names to TextMate scope selectors.
 *
 * This table is the bridge between GNOME Builder's syntax highlighting and VS
 * Code. It is hand curated: run "Developer: Inspect Editor Tokens and Scopes"
 * in VS Code to discover the scope a piece of text actually receives, and use
 * https://gitlab.gnome.org/GNOME/gtksourceview/-/tree/master/data/language-specs
 * to find which GtkSourceView style a construct gets.
 *
 * Ordering matters. TextMate applies theme rules in order and a later rule wins
 * over an earlier one, so generic `def:*` rules come first and language
 * specific rules come afterwards.
 *
 * Until TextMate supports scope wildcards
 * (https://github.com/microsoft/vscode-textmate/issues/160), a scope such as
 * `source.rust storage.type` must be written in full instead of
 * `storage.type.rust`.
 */

export const SCOPE_MAP = {
  // ---------------------------------------------------------------------
  // Generic defaults
  // ---------------------------------------------------------------------

  // The default text colour. An empty selector applies to everything, which
  // also gives us a single place to define the theme's base foreground.
  text: [
    // Empty selector: matches every scope.
    '',
    // Embedded expressions, for example the `${something}` inside a string.
    'meta.embedded',
    // Variables that a language server or grammar explicitly marks as the
    // default colour. This is a workaround for nix-ide and similar extensions
    // that would otherwise colour them like strings.
    // https://github.com/nix-community/vscode-nix-ide/pull/222
    'variable',
    // Punctuation around an embedded expression in a JSX attribute.
    'meta.tag.attributes punctuation.section.embedded',

    // Most operators are symbolic and read better as plain text. Alphabetical
    // operators are opted back in under def:statement.
    'keyword.operator',
    'storage.type.function.arrow', // =>
    // YAML block scalar indicators.
    'keyword.control.flow.block-scalar.literal',
    'keyword.control.flow.block-scalar.folded',
    'storage.modifier.chomping-indicator',

    'storage.type.string', // f, b and r string prefixes in Python and Rust.
    'string.quoted.byte.raw', // b"..." in Rust.

    // `macro_rules! name {` in Rust: gtksv leaves the macro name uncoloured.
    'meta.macro.rules entity.name.function.macro.rust',
  ],

  'def:base-n-integer': [
    // Whole numbers.
    'constant.numeric.binary', // 0b1
    'constant.numeric.octal', // 0o1
    'constant.numeric.hex', // 0x1
    // Just the prefix or postfix.
    'keyword.other.unit.binary', // 0b
    'keyword.other.unit.octal', // 0o
    'keyword.other.unit.hexadecimal', // 0x
    'keyword.other.unit.imaginary', // 0x01i
    'keyword.other.unit.exponent', // 0x01p2
  ],

  'def:boolean': [
    'constant.language.boolean', // true / false in most languages
    'constant.language.bool', // true / false in Rust
  ],

  'def:comment': [
    'comment',
    'comment.line',
    'comment.block',
    // YAML document markers.
    'entity.other.document.begin.yaml',
    'entity.other.document.end.yaml',
    // Punctuation that only exists to open or close a comment.
    'punctuation.definition.comment',
    'punctuation.definition.begin.comment',
    'punctuation.definition.end.comment',
    'punctuation.definition.string.begin.comment',
    'punctuation.definition.string.end.comment',
    // Commented out code.
    'comment.block.documentation punctuation',
  ],

  'def:constant': [
    // `constant` on its own would also match user defined constants, so only
    // the language scope is used.
    'constant.language', // true, false, null, undefined
    'constant.language.infinity',
    'constant.language.nan',
    // A character literal such as 'a' in Rust. gtksv has no dedicated
    // character style and falls back to def:constant.
    'string.quoted.single.char',
    'string.quoted.single.char.rust',
    // `{ "key": ... }` in JSON and friends.
    'support.type.property-name',
    'support.type.property-name.json',
    'support.type.property-name.jsonc',
    // CSS property values and units.
    'support.constant.property-value.css',
    'support.constant.property-value.scss',
    'support.constant.property-value.less',
    'source.css keyword.other.unit',
    'source.css.scss keyword.other.unit',
    'source.css.less keyword.other.unit',
    // Named colours and font names.
    'support.constant.color',
    'support.constant.font-name',
    'support.constant.media',
    'support.constant.media-type',
    'constant.other.color.rgb-value',
    'constant.other.rgb-value',
    // SQL keywords that behave like constants.
    'constant.other.database-name.sql',
    'constant.other.table-name.sql',
  ],

  // `def:number` owns plain `constant.numeric`; this only adds the numeric type suffix.
  'def:decimal': ['constant.numeric entity.name.type.numeric'], // 1i64

  'def:deletion': ['markup.deleted', 'markup.strikethrough.markdown'],

  'def:doc-comment-element': [
    'comment.block.documentation',
    'comment.block.documentation variable',
    'comment.block.documentation keyword',
    'comment.block.documentation storage.type',
    'comment.block.javadoc',
    'comment.block.documentation.rs',
  ],

  'def:emphasis': [
    'markup.italic',
    'markup.italic.markdown',
    'markup.italic.asciidoc',
    'markup.italic.rst',
    'emphasis',
  ],

  'def:error': ['invalid', 'invalid.illegal', 'invalid.deprecated', 'token.error-token'],

  'def:floating-point': [
    'constant.numeric.float',
    'constant.numeric.float.binary',
    'constant.numeric.float.hex',
    'constant.numeric.float.octal',
  ],

  // gtksv is inconsistent about what counts as a function name: in Python it
  // colours names in definitions, in C and JavaScript it does not. Less colour
  // is better than more colour, so function names stay uncoloured and are
  // opted into per language below.
  'def:function': [],

  'def:heading': [
    'markup.heading',
    'markup.heading.markdown',
    'markup.heading.atx',
    'markup.heading.setext',
    'markup.heading.asciidoc',
    'markup.heading.rst',
    'entity.name.section',
  ],

  'def:identifier': [
    // gtksv colours plain identifiers with its accent green. In TextMate this
    // is the closest analogue: names that are not otherwise classified.
    'entity.name',
    'variable.other.readwrite',
  ],

  'def:inline-code': [
    'markup.inline.raw',
    'markup.inline.raw.markdown',
    'markup.raw',
    'markup.fenced_code',
    'markup.fenced_code.block.markdown',
    'meta.code-fence',
    'constant.other.language-name',
  ],

  'def:statement': [
    // Keywords, declarations and control flow. GtkSourceView calls this style
    // `def:statement`; it is what the old `def:keyword` style became.
    'keyword',
    'keyword.control',
    // Alphabetical operators and keywords.
    'keyword.operator.new', // new
    'keyword.operator.expression', // typeof, instanceof
    'keyword.operator.wordlike', // and, or, not
    'keyword.operator.logical.python', // and, or
    'keyword.operator.delete',
    'keyword.operator.cast',
    'keyword.operator.sizeof',
    'keyword.operator.alignof',
    'keyword.operator.typeid',
    'keyword.operator.alignas',
    'keyword.operator.instanceof',
    'keyword.operator.noexcept',
    'keyword.operator.other',
    'keyword.control.flow',
    'keyword.control.flow.return',
    'keyword.control.flow.break',
    'keyword.control.flow.continue',
    'keyword.control.flow.goto',
    'keyword.control.flow.throw',
    'keyword.control.flow.yield',
    'keyword.control.flow.await',
    'keyword.control.conditional',
    'keyword.control.loop',
    'keyword.control.switch',
    'keyword.control.trycatch',
    'keyword.control.import',
    'keyword.control.export',
    'keyword.control.from',
    'keyword.control.as',
    'keyword.control.default',
    'keyword.other',
    'keyword.other.using',
    'keyword.other.operator',
    // Declaration keywords.
    'storage.modifier', // static, final, pub
    'storage.type', // var, let, const, def, fn
    'storage.type.class', // class Cat
    'storage.type.function', // function meow()
    'storage.type.struct',
    'storage.type.enum',
    'storage.type.interface',
    'storage.type.trait',
    'storage.type.impl',
    'storage.type.namespace',
    'storage.type.module',
    'storage.type.function.async',
    'storage.type.generic',
    // Rust and Swift specific declarations.
    'storage.type.rust',
    'storage.type.swift',
    // TypeScript type keywords.
    'keyword.type',
    'keyword.type.primitive',
    // Shell builtins and Ruby blocks.
    'keyword.other.shell',
    'keyword.control.ruby',
    'keyword.control.shell',
    // SQL statement starters.
    'keyword.other.DML.sql',
    'keyword.other.DDL.sql',
    'keyword.other.alias.sql',
    'keyword.other.order.sql',
    // YAML keys are tagged as tag names. Tag names and strings are a very
    // similar colour (https://github.com/piousdeer/vscode-adwaita/issues/4), so
    // gtksv treats them as keywords and so do we.
    'entity.name.tag.yaml',
    // Workarounds for extensions that mark keywords with storage.type.
    // https://github.com/piousdeer/vscode-adwaita/issues/5
    'source.js storage.type',
    'source.jsx storage.type',
    'source.ts storage.type',
    'source.tsx storage.type',
    'source.rust storage.type',
  ],

  'def:link-destination': [
    'markup.underline.link',
    'meta.link.inline.description',
    'meta.link.reference',
    'constant.other.reference.link',
    'string.other.link',
  ],

  'def:link-text': ['markup.link', 'meta.link.inline', 'meta.link.reference.def', 'meta.link.inet'],

  'def:list-marker': [
    'markup.list',
    'markup.list.unnumbered',
    'markup.list.numbered',
    'markup.list.checked',
    'markup.list.unchecked',
    'punctuation.definition.list.begin',
    'punctuation.definition.list.begin.markdown',
  ],

  'def:net-address': [
    'markup.underline.link.image',
    'meta.link.inline.destination',
    'constant.other.email',
    'constant.other.url',
  ],

  'def:note': [
    // A note callout such as `> [!NOTE]` in a Markdown alert.
    'markup.quote',
    'markup.quote.markdown',
    'text.html.markdown markup.quote',
  ],

  'def:number': ['constant.numeric'],

  // Code blocks that are not highlighted by a grammar, for example the body of
  // an unknown fenced block.
  'def:preformatted-section': [],

  'def:preprocessor': [
    'meta.preprocessor',
    'meta.preprocessor keyword.control', // #include <config.h>
    'meta.preprocessor.string',
    'meta.preprocessor.numeric',
    'entity.name.function.preprocessor',
    'punctuation.decorator', // @decorator in TypeScript
    'meta.decorator entity.name.function',
    'entity.name.function.decorator', // @decorator in Python
    'keyword.control.at-rule', // @media in CSS
    'keyword.control.at-rule.media',
    'keyword.control.at-rule.charset',
    'keyword.control.at-rule.document',
    'keyword.control.at-rule.font-face',
    'keyword.control.at-rule.import',
    'keyword.control.at-rule.keyframes',
    'keyword.control.at-rule.supports',
    'constant.character.entity', // &amp;
    'punctuation.section.embedded', // ${ }
    'punctuation.definition.template-expression', // ${ } in JavaScript
  ],

  'def:shebang': ['comment.line.number-sign.shebang', 'comment.line.shebang'],

  'def:special-char': [
    'constant.character.escape', // \n
    'constant.character.escape.ansi',
    'constant.character.numeric',
  ],

  'def:string': [
    'string',
    'string.quoted',
    'string.quoted.double',
    'string.quoted.single',
    'string.quoted.triple',
    'string.quoted.raw',
    'string.quoted.heredoc',
    'string.template',
    'string.interpolated',
    'string.regexp',
    'string.unquoted',
    'string.other',
    'constant.character',
    // Punctuation that delimits a string is part of the string.
    'punctuation.definition.string',
    'punctuation.definition.string.begin',
    'punctuation.definition.string.end',
    'punctuation.definition.template-expression.begin',
    'punctuation.definition.template-expression.end',
  ],

  'def:strong-emphasis': [
    'markup.bold',
    'markup.bold.markdown',
    'markup.bold.asciidoc',
    'markup.bold.rst',
    'strong',
  ],

  'def:type': [
    'entity.name.type', // referring to a type
    'entity.name.type.class',
    'entity.name.type.struct',
    'entity.name.type.enum',
    'entity.name.type.interface',
    'entity.name.type.trait',
    'entity.name.type.module',
    'entity.name.type.namespace',
    'entity.name.namespace',
    'entity.name.scope-resolution',
    // C# spells type keywords differently.
    'keyword.type.cs',
    // Built-in types and classes.
    'support.type',
    'support.type.go',
    'support.class.builtin',
    'support.class.builtin.js',
    'support.class.promise',
    'support.class.console.js',
    // Go predeclared types are `storage.type`.
    'storage.type.go',
    'storage.type.numeric.go',
    'storage.type.boolean.go',
    'storage.type.byte.go',
    'storage.type.string.go',
    'storage.type.uintptr.go',
    'storage.type.error.go',
    'storage.type.rune.go',
    // Java and Groovy spell built-in types the same way.
    'storage.type.primitive.java',
    'storage.type.primitive.array.java',
    'storage.type.object.array.java',
    'storage.type.generic.java',
    'storage.type.token.java',
    'storage.type.annotation.java',
    'storage.type.primitive.groovy',
    'storage.type.generic.groovy',
    'storage.type.token.groovy',
    // C# and Kotlin.
    'storage.type.cs',
    'storage.type.generic.cs',
    'storage.type.modifier.cs',
    'storage.type.variable.cs',
    'keyword.type.kotlin',
    // Zig and Swift.
    'storage.type.zig',
    'keyword.type.swift',
    // Generic type parameters.
    'entity.name.type.type-parameter',
    'entity.name.type.parameter',
    'meta.type.parameters entity.name.type',
  ],

  'def:underlined': ['markup.underline', 'markup.underline.markdown'],

  'def:warning': ['token.warn-token'],

  // ---------------------------------------------------------------------
  // C#
  // ---------------------------------------------------------------------

  'c-sharp:format': ['constant.other.format'],

  'c-sharp:preprocessor': ['meta.preprocessor.cs', 'entity.name.preprocessor.cs'],

  // ---------------------------------------------------------------------
  // C and C++
  // ---------------------------------------------------------------------

  'c:printf': ['constant.other.placeholder', 'constant.other.placeholder.c'],

  'c:signal-name': ['entity.name.signal'],

  'c:storage-class': [
    'source.c storage.modifier',
    'source.cpp storage.modifier',
    'storage.modifier.c',
    'storage.modifier.cpp',
  ],

  'c:type-keyword': ['source.c storage.type', 'source.cpp storage.type', 'storage.type.c'],

  // ---------------------------------------------------------------------
  // CSS, SCSS and Less
  // ---------------------------------------------------------------------

  'css:id-selector': [
    'entity.other.attribute-name.id.css',
    'entity.other.attribute-name.id.scss',
    'entity.other.attribute-name.id.less',
  ],

  'css:property-name': [
    'support.type.property-name.css',
    'support.type.property-name.scss',
    'support.type.property-name.less',
    'meta.property-name.css',
    'meta.property-name.scss',
    'meta.property-list.css meta.property-name',
  ],

  'css:pseudo-selector': [
    'entity.other.attribute-name.pseudo-element.css',
    'entity.other.attribute-name.pseudo-class.css',
    'entity.other.attribute-name.pseudo-element.scss',
    'entity.other.attribute-name.pseudo-class.scss',
    'entity.other.attribute-name.pseudo-element.less',
    'entity.other.attribute-name.pseudo-class.less',
    'meta.selector.css punctuation.section.function',
    'meta.selector.scss punctuation.section.function',
  ],

  'css:selector-symbol': [
    // The combinators >, + and ~.
    'meta.selector.css keyword.operator',
    'meta.selector.scss keyword.operator',
    'meta.selector.less keyword.operator',
    // Intentionally different from gtksv: rather than colouring [, = and ] in
    // `elem[attr="val"]`, only the attribute name is coloured.
    'entity.other.attribute-name.css',
    'entity.other.attribute-name.scss',
    'entity.other.attribute-name.less',
  ],

  'css:type-selector': [
    'entity.name.tag.css',
    'entity.name.tag.scss',
    'entity.name.tag.less',
    'entity.name.tag.wildcard.css',
    'entity.other.attribute-name.class.css',
    'entity.other.attribute-name.class.scss',
    'entity.other.attribute-name.class.less',
    'source.css entity.name.tag',
  ],

  'css:vendor-specific': [
    'support.type.vendored.property-name.css',
    'support.type.vendored.property-name.scss',
    'support.type.vendored.property-name.less',
  ],

  // ---------------------------------------------------------------------
  // Diff
  // ---------------------------------------------------------------------

  'diff:added-line': ['markup.inserted.diff', 'meta.diff.inserted', 'markup.inserted'],

  'diff:changed-line': ['markup.changed.diff', 'markup.changed', 'meta.diff.changed'],

  'diff:diff-file': ['meta.diff.header', 'meta.diff.header.from-file', 'meta.diff.header.to-file'],

  'diff:location': ['meta.diff.range', 'meta.diff.range.normalized'],

  'diff:removed-line': ['markup.deleted.diff', 'meta.diff.deleted'],

  // ---------------------------------------------------------------------
  // Go
  // ---------------------------------------------------------------------

  'go:printf': ['constant.other.placeholder.go'],

  // ---------------------------------------------------------------------
  // Python
  // ---------------------------------------------------------------------

  'python:builtin-function': [
    'support.function.builtin.python',
    'support.function.magic.python',
    'support.type.python',
  ],

  'python:class-name': ['entity.name.type.class.python', 'entity.name.type.python'],

  'python:module-handler': [
    'keyword.control.import.python',
    'keyword.control.import.from.python',
    'keyword.control.import.as.python',
  ],

  // ---------------------------------------------------------------------
  // Rust
  // ---------------------------------------------------------------------

  'rust:attribute': [
    'meta.attribute.rust',
    'meta.attribute.rust keyword.operator',
    'punctuation.definition.attribute.rust',
  ],

  'rust:lifetime': [
    'entity.name.type.lifetime.rust',
    'storage.modifier.lifetime.rust',
    'punctuation.definition.lifetime.rust',
  ],

  'rust:macro': [
    'entity.name.function.macro',
    'entity.name.function.macro.rust',
    'support.macro.rust',
  ],

  // ---------------------------------------------------------------------
  // Vala
  // ---------------------------------------------------------------------

  'vala:attributes': ['meta.vala.attribute', 'entity.name.vala.attribute'],

  // ---------------------------------------------------------------------
  // XML, HTML and friends
  // ---------------------------------------------------------------------

  'xml:attribute-name': [
    // <property name="variant">...
    'meta.tag entity.other.attribute-name',
    'meta.tag.inline.attributes',
    // <property name=>"variant">... in JSX
    'meta.tag keyword.operator.assignment',
    'meta.jsx.children',
    // <property name=>"variant">... in HTML and alike
    'punctuation.separator.key-value.html',
    'punctuation.separator.key-value.svelte',
    'punctuation.separator.key-value.xml',
    'punctuation.separator.key-value.vue',
    // XML has no dedicated selector for "=".
    'text.xml meta.tag',
  ],

  'xml:attribute-value': [
    'meta.tag string',
    'meta.tag string.quoted',
    'string.quoted.double.html',
    'string.quoted.single.html',
    'string.quoted.double.xml',
    'string.quoted.single.xml',
    'string.unquoted.html',
    'string.unquoted.xml',
  ],

  'xml:element-name': [
    // <property name="variant">...
    'entity.name.tag',
    'entity.name.tag.html',
    'entity.name.tag.xml',
    'entity.name.tag.jsx',
    'entity.name.tag.tsx',
    // <Component /> in Svelte and Vue.
    'support.class.component.svelte',
    'support.class.component.vue',
    // The < and > around a tag name.
    'punctuation.definition.tag',
    'punctuation.definition.tag.begin',
    'punctuation.definition.tag.end',
  ],

  'xml:namespace': [
    'entity.name.tag.namespace.xml',
    'entity.name.tag.namespace.html',
    'variable.namespace.xml',
  ],

  'xml:processing-instruction': [
    // <?xml version="1.0" encoding="UTF-8"?>
    'text.xml meta.tag.preprocessor entity.name.tag',
    'text.xml meta.tag.preprocessor punctuation.definition.tag',
    'meta.tag.preprocessor.entity',
    'meta.tag.sgml',
  ],
} as const satisfies Record<string, readonly string[]>;

export type GtkSourceViewStyleName = keyof typeof SCOPE_MAP;

/** Style names, in the order the scope map declares them. */
export const SCOPE_MAP_ORDER = Object.keys(SCOPE_MAP) as GtkSourceViewStyleName[];
