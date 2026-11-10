// TypeScript and JavaScript: the core syntax surface.
//
// Exercises: line comments, block comments, JSDoc, keywords, control flow,
// declarations, types, interfaces, enums, generics, decorators, classes,
// async/await, template literals, numbers, operators, booleans, escapes.

/** A documented type. JSDoc comments get their own muted treatment. */
export interface Widget<T extends object = object> {
  readonly id: string;
  label?: string;
  weight: number;
  tags: readonly string[];
  payload: T;
  kind: 'button' | 'switch' | 'slider';
}

export enum Layout {
  SidebarLeft = 'sidebar-left',
  SidebarRight = 'sidebar-right',
  Panel = 'panel',
}

const HEX = 0x1c71_d8;
const OCTAL = 0o755;
const BINARY = 0b1010_1100;
const FLOAT = 1.5e-9;
const BIG = 900_719_925_474_099n;

export function classify(widget: Widget): string {
  const { weight, tags } = widget;
  if (weight <= 0 || Number.isNaN(weight)) {
    throw new RangeError(`weight must be positive, got ${weight}`);
  }
  for (const tag of tags) {
    if (tag.startsWith('deprecated:')) continue;
  }
  return weight > 100 ? 'heavy' : weight > 10 ? 'medium' : 'light';
}

abstract class Base {
  protected constructor(private readonly name: string) {}

  abstract describe(): string;

  get displayName(): string {
    return `${this.name} (${this.kind})`;
  }

  protected abstract get kind(): string;
}

@sealed
class Button extends Base {
  static readonly count = 0;

  constructor(
    name: string,
    public readonly variant: 'flat' | 'suggested' | 'destructive' = 'suggested',
  ) {
    super(name);
  }

  protected get kind(): string {
    return 'button';
  }

  describe(): string {
    return `${this.displayName}: ${this.variant ?? 'none'}`;
  }
}

async function loadAll(urls: string[]): Promise<Widget[]> {
  const results = await Promise.allSettled(urls.map((url) => fetch(url)));
  return results
    .filter((result): result is PromiseFulfilledResult<Widget> => result.status === 'fulfilled')
    .map((result) => result.value);
}

const pattern = /^(?:adwaita|libadwaita)-(dark|light)$/gi;
const escaped = 'line one\nline two\tand a \u{1f600}';
const query = `SELECT * FROM themes WHERE name = ${'Adwaita Dark'}`;

export default Button;
