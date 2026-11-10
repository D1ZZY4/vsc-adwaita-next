// TSX and JSX: markup inside expressions.
//
// Exercises: JSX element names, attribute names, attribute values, embedded
// expressions, expression containers, member access, conditional rendering.

import { useState } from 'react';

interface Props {
  title: string;
  items: readonly string[];
  onSelect?: (index: number) => void;
}

export function Picker({ title, items, onSelect }: Props) {
  const [active, setActive] = useState<number>(0);
  const [open, setOpen] = useState(false);

  return (
    <section className="picker" data-variant="adwaita" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <button type="button" onClick={() => setOpen(!open)} disabled={items.length === 0}>
          {open ? 'Collapse' : 'Expand'}
        </button>
      </header>

      <ul role="listbox">
        {items.map((item, index) => (
          <li
            key={item}
            role="option"
            aria-selected={index === active}
            className={index === active ? 'is-active' : undefined}
            onClick={() => {
              setActive(index);
              onSelect?.(index);
            }}
          >
            {index === active ? <strong>{item}</strong> : item}
          </li>
        ))}
      </ul>

      {items.length === 0 && <p className="empty">Nothing to pick.</p>}
      {open ? <footer>Showing {items.length} items</footer> : null}
    </section>
  );
}
