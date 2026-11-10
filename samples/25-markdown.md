# Adwaita Surfaces

A short document exercising the Markdown constructs the theme styles
separately: headings, emphasis, strong emphasis, strikethrough, lists, links,
images, quotes, alerts, inline code and fenced code.

## Emphasis and strong emphasis

Text can be _italic_, **bold**, **_both_**, ~~struck through~~,
`inline code`, or <kbd>keyboard</kbd> input. A
[link to libadwaita](https://gnome.pages.gitlab.gnome.org/libadwaita/),
a reference link [GNOME HIG][hig], and an autolink
<https://www.gnome.org/>.

[hig]: https://developer.gnome.org/hig/ "GNOME Human Interface Guidelines"

![Adwaita icon](./icon.png)

Subscripts and superscript: H~2~O and E=mc^2^.

## Lists

1. Ordered item one
2. Ordered item two
   - Nested unordered
   - Another nested item
3. Ordered item three

- Unordered item
- Another item
  - Deeper
    - Deepest

- [ ] Task not done
- [x] Task done

## Quotes and alerts

> A block quote spanning
> multiple lines.
>
> > Nested quote.

> [!NOTE]
> Notes are styled with the `def:note` Adwaita style: dark text on a yellow
> background, bold.

> [!TIP]
> Tips, warnings and important alerts use the same style.

> [!WARNING]
> Be careful with surface elevation.

## Tables

| Surface | Level | Recessed |
| ------- | ----: | :------: |
| view    |     0 |   yes    |
| window  |     1 |    no    |
| sidebar |     2 |    no    |
| dialog  |     3 |    no    |

## Code

Inline code looks like `const accent = "#3584e4";`.

```json
{
  "workbench.colorTheme": "Adwaita Dark",
  "editor.fontFamily": "JetBrains Mono"
}
```

```typescript
interface Surface {
  readonly name: string;
  elevation: number;
}

const view: Surface = { name: 'view', elevation: 0 };
```

```bash
bun run build
```

```
No language, so no highlighting.
```

## Horizontal rule

---

## Definitions and footnotes

Term
: A definition.

A footnote reference[^1].

[^1]: The footnote text.

<!-- An HTML comment, which Markdown also renders -->

## Line breaks

A hard break follows two trailing spaces.  
This is the next line.

Final paragraph with an entity `&amp;` and a Unicode character é.
