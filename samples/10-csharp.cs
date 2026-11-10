// C#: preprocessor directives, nullable reference types, records, LINQ.
//
// Exercises: preprocessor directives, using directives, nullable reference
// types, records, pattern matching, string interpolation, verbatim strings.

#if NET8_0_OR_GREATER
#define ADWAITA_MODERN
#endif

using System;
using System.Collections.Generic;
using System.Linq;

namespace Gnome.Adwaita;

/// <summary>A documented surface.</summary>
public interface IDescriber
{
    string Describe();

    bool IsRecessed => Elevation < 2;

    int Elevation { get; }
}

public enum Level
{
    View,
    Window,
    Sidebar,
    Dialog
}

public sealed record Surface(string Name, Level Level, IReadOnlyList<string> Tones) : IDescriber
{
    public int Elevation => (int)Level;

    public string Describe() => $"{Name} (level {Elevation}, {Tones.Count} tones)";
}

public static class Surfaces
{
    private const string Blue = "#3584e4";
    private const long Hex = 0x1C71D8L;
    private const double Ratio = 1.5e-9;
    private const char Escape = '\n';

    public static IEnumerable<TResult> MapAll<TSource, TResult>(
        IEnumerable<TSource> source,
        Func<TSource, TResult> selector) => source.Select(selector);

    public static string? FirstNonEmpty(IEnumerable<string?> values)
        => values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

    public static void Main()
    {
        IReadOnlyList<Surface> surfaces = new[]
        {
            new Surface("view", Level.View, Array.Empty<string>()),
            new Surface("sidebar", Level.Sidebar, new[] { "blue_3", "teal_2" }),
        };

        foreach (var surface in surfaces)
        {
            Console.WriteLine($"{surface.Describe()} recessed={surface.IsRecessed}");
        }

        var label = surfaces[0].Level switch
        {
            Level.View => "view",
            Level.Window => "window",
            Level.Sidebar or Level.Dialog => "chrome",
            _ => throw new ArgumentOutOfRangeException(nameof(surfaces)),
        };

        string verbatim = @"C:\path\to\adwaita";
        string interpolated = $"{Blue} {Hex:X} {Ratio:E2} {Escape}";

        Console.WriteLine(label);
        Console.WriteLine(verbatim);
        Console.WriteLine(interpolated);
        Console.WriteLine(FirstNonEmpty(new[] { null, "first", "second" }) ?? "none");
    }
}
