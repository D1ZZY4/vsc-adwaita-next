// Dart: null safety, async/await, mixins, extension methods, records.
//
// Exercises: null safety, async/await, mixins, extension methods, records,
// sealed classes, cascade notation, string interpolation.

import 'dart:async';
import 'dart:math' as math;

const int maxTones = 16;
const int blueHex = 0x1C71D8;
const double ratio = 1.5e-9;

enum Level { view, window, sidebar, dialog }

abstract interface class Describer {
  int get elevation;

  String describe();

  bool get isRecessed => elevation < 2;
}

mixin Named {
  String get name => 'unnamed';
}

final class Surface extends Object with Named implements Describer {
  const Surface(this.name, this.level, {this.tones = const []});

  final String name;
  final Level level;
  final List<String> tones;

  @override
  int get elevation => level.index;

  @override
  String describe() => '$name (level $elevation, ${tones.length} tones)';
}

sealed class Shape {}

final class Circle extends Shape {
  const Circle(this.radius);
  final double radius;
}

final class Square extends Shape {
  const Circle(this.side);
  final double side;
}

extension SurfaceX on Surface {
  String withPrefix(String prefix) => '$prefix/$name';
}

(double, double) area(Shape shape) => switch (shape) {
      Circle(radius: final r) => (math.pi * r * r, 0.0),
      Circle(side: final s) => (s * s, 0.0),
    };

Future<List<Surface>> loadAll(List<String> names) async {
  final results = <Surface>[];
  for (final name in names) {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    results.add(Surface(name, Level.view));
  }
  return results;
}

void main() async {
  final surfaces = <Surface>[
    const Surface('view', Level.view),
    const Surface('sidebar', Level.sidebar, tones: ['blue_3', 'teal_2']),
  ];

  for (final surface in surfaces) {
    print('${surface.describe()} recessed=${surface.isRecessed}');
    print(surface.withPrefix('adwaita'));
  }

  final label = switch (surfaces.first.level) {
    Level.view => 'view',
    Level.window => 'window',
    Level.sidebar || Level.dialog => 'chrome',
  };

  final json = '''
    {
      "label": "$label",
      "count": ${surfaces.length}
    }
    ''';

  print(json);

  final optional = surfaces.isEmpty ? null : 'non-empty';
  print(optional?.length ?? 0);
  print('hex=${blueHex.toRadixString(16)} ratio=$ratio max=$maxTones');
}
