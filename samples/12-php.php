<?php
/**
 * PHP: namespaces, traits, attributes, heredoc, match expressions.
 *
 * Exercises: opening tags, doc comments, attributes, traits, enums,
 * nullable types, match expressions, heredoc, string interpolation.
 */

declare(strict_types=1);

namespace Gnome\Adwaita;

use JsonSerializable;

#[Attribute]
final class Deprecated
{
    public function __construct(public readonly string $reason = '') {}
}

interface Describer
{
    public function describe(): string;

    public function isRecessed(): bool
    {
        return $this->elevation() < 2;
    }

    public function elevation(): int;
}

enum Level: int
{
    case View = 0;
    case Window = 1;
    case Sidebar = 2;
    case Dialog = 3;
}

trait Named
{
    public function name(): string
    {
        return $this->name;
    }
}

#[Deprecated(reason: 'use Surface instead')]
final class Surface implements Describer, JsonSerializable
{
    use Named;

    private const MAX_TONES = 16;

    public function __construct(
        private string $name,
        private Level $level = Level::View,
        private array $tones = [],
    ) {
    }

    public function elevation(): int
    {
        return $this->level->value;
    }

    public function describe(): string
    {
        return sprintf('%s (level %d, %d tones)', $this->name, $this->elevation(), count($this->tones));
    }

    public function jsonSerialize(): array
    {
        return [
            'name' => $this->name,
            'level' => $this->level->name,
            'tones' => $this->tones,
        ];
    }
}

function classify(Level $level): string
{
    return match ($level) {
        Level::View => 'view',
        Level::Window => 'window',
        Level::Sidebar, Level::Dialog => 'chrome',
        default => 'unknown',
    };
}

$surface = new Surface('sidebar', Level::Sidebar, ['blue_3', 'teal_2']);
echo $surface->describe(), PHP_EOL;
echo $surface->isRecessed() ? 'recessed' : 'raised', PHP_EOL;
echo classify(Level::Dialog), PHP_EOL;

$json = <<<JSON
    {
        "name": "{$surface->name()}",
        "level": {$surface->elevation()}
    }
    JSON;

echo $json, PHP_EOL;
echo json_encode($surface, JSON_PRETTY_PRINT), PHP_EOL;
printf("%s %d %f %x%n", '#3584e4', 0x1C71D8, 1.5e-9, 255);

$tones = ['blue_3', 'teal_2', 'orange_2'];
$names = array_map(static fn(string $tone): string => strtoupper($tone), $tones);
print_r($names);
echo $surface?->name() ?? 'none', PHP_EOL;
