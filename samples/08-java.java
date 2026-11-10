// Java: annotations, generics, records, sealed types.
//
// Exercises: annotations, preprocessor-like directives, primitive types,
// generics, records, sealed classes, switch expressions, text blocks.

package org.gnome.adwaita;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

/**
 * A documented surface.
 *
 * @author the VSC Adwaita Next contributors
 */
public interface Describer {
    String describe();

    default boolean isRecessed() {
        return elevation() < 2;
    }

    int elevation();
}

enum Level {
    VIEW,
    WINDOW,
    SIDEBAR,
    DIALOG
}

record Surface(String name, Level level, List<String> tones) implements Describer {
    static final int MAX_TONES = 16;

    Surface {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        tones = List.copyOf(tones);
    }

    @Override
    public int elevation() {
        return level.ordinal();
    }

    @Override
    public String describe() {
        return "%s (level %d, %d tones)".formatted(name, elevation(), tones.size());
    }
}

sealed interface Shape permits Circle, Square {}

record Circle(double radius) implements Shape {}

record Square(double side) implements Shape {}

public final class Surfaces {
    private static final String BLUE = "#3584e4";
    private static final long HEX = 0x1C71D8L;
    private static final double FLOAT = 1.5e-9;
    private static final char ESCAPE = '\n';

    private Surfaces() {}

    public static <T, R> List<R> mapAll(List<T> input, Function<? super T, ? extends R> mapper) {
        return input.stream().map(mapper).toList();
    }

    public static Optional<String> firstNonEmpty(List<String> values) {
        return values.stream().filter(value -> !value.isBlank()).findFirst();
    }

    public static void main(String[] args) {
        var surface = new Surface("sidebar", Level.SIDEBAR, List.of("blue_3", "teal_2"));

        String label = switch (surface.level()) {
            case VIEW -> "view";
            case WINDOW -> "window";
            case SIDEBAR, DIALOG -> "chrome";
        };

        String json = """
                {
                  "name": "%s",
                  "level": "%s"
                }
                """.formatted(surface.name(), label);

        System.out.println(surface.describe() + " recessed=" + surface.isRecessed());
        System.out.println(json);
        System.out.printf("%s %d %f %c%n", BLUE, HEX, FLOAT, ESCAPE);
    }
}
