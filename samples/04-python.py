#!/usr/bin/env python3
"""Python: decorators, docstrings, builtins and type hints.

Exercises: shebang comments, module docstrings, decorators, f-strings,
builtin functions, class names, import handlers, type hints, magic methods.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Iterable, Iterator, Protocol


class Renderable(Protocol):
    def render(self) -> str: ...


@dataclass(frozen=True, slots=True)
class Surface:
    """A named surface with an elevation.

    Docstrings that use reStructuredText markup get their own muted treatment.
    """

    name: str
    elevation: int = 0
    tones: tuple[str, ...] = field(default=())

    def __post_init__(self) -> None:
        if self.elevation < 0:
            raise ValueError(f"elevation must be >= 0, got {self.elevation}")

    def __repr__(self) -> str:
        return f"Surface(name={self.name!r}, elevation={self.elevation})"

    def __len__(self) -> int:
        return len(self.tones)

    @property
    def is_recessed(self) -> bool:
        return self.elevation < 2

    @classmethod
    def from_names(cls, names: Iterable[str]) -> list[Surface]:
        return [cls(name=name) for name in names]


VIEW = Surface("view", 0)
SIDEBAR = Surface("sidebar", 2, ("blue_3", "teal_2"))

print(f"{VIEW!r} recessed={VIEW.is_recessed}")
print(f"hypot(3, 4) = {math.hypot(3, 4)}")
print(f"rounded = {round(math.pi, 4)}, floor = {math.floor(math.pi)}")
print(f"absolute = {abs(-7)}, power = {pow(2, 10)}, sum = {sum([1, 2, 3])}")
print(f"formatted = {3.14159:.2f}, padded = {42:>6}, hex = {255:#x}")


def walk(surfaces: Iterable[Surface]) -> Iterator[tuple[str, int]]:
    for surface in surfaces:
        yield surface.name, surface.elevation


for name, elevation in walk([VIEW, SIDEBAR]):
    print(f"{name}: {elevation}")

if __name__ == "__main__":
    import sys

    sys.exit(print("done"))


class _Private:
    pass


lambda_fn = lambda value: value * 2
assert lambda_fn(21) == 42
del lambda_fn
