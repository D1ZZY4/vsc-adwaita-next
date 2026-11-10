// Zig: comptime, error unions, optionals, tagged unions, defer.
// Exercises: comments, const and var, comptime, error unions, optionals,
// tagged unions, defer, switch expressions, string literals.

const std = @import("std");

const Level = enum(u8) {
    view = 0,
    window = 1,
    sidebar = 2,
    dialog = 3,

    pub fn isRecessed(self: Level) bool {
        return @intFromEnum(self) < 2;
    }
};

const Palette = struct {
    blue: []const u8 = "#3584e4",
    teal: []const u8 = "#5bc8af",
    orange: []const u8 = "#ffa348",
};

const SurfaceError = error{
    NameTooShort,
    ElevationOutOfRange,
};

const Surface = struct {
    name: []const u8,
    elevation: u8,
    tones: std.ArrayList([]const u8),

    const Self = @This();

    fn init(allocator: std.mem.Allocator, name: []const u8, elevation: u8) !Self {
        if (name.len == 0) return SurfaceError.NameTooShort;
        if (elevation > 7) return SurfaceError.ElevationOutOfRange;

        return Self{
            .name = name,
            .elevation = elevation,
            .tones = std.ArrayList([]const u8).init(allocator),
        };
    }

    fn deinit(self: *Self) void {
        self.tones.deinit();
    }

    fn isRecessed(self: Self) bool {
        return self.elevation < 2;
    }

    fn describe(self: Self, writer: anytype) !void {
        try writer.print("{s} (level {d}, {d} tones)", .{ self.name, self.elevation, self.tones.items.len });
    }
};

fn classify(elevation: u8) []const u8 {
    return switch (elevation) {
        0 => "recessed",
        1 => "chrome",
        2, 3 => "overlay",
        else => "unknown",
    };
}

fn maxSurface(comptime T: type, a: T, b: T) T {
    return if (a.elevation >= b.elevation) a else b;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer std.debug.assert(gpa.deinit() == .ok);

    const allocator = gpa.allocator();

    var view = try Surface.init(allocator, "view", 0);
    defer view.deinit();

    var sidebar = try Surface.init(allocator, "sidebar", 2);
    defer sidebar.deinit();

    const stdout = std.io.getStdOut().writer();

    for ([_]*Surface{ &view, &sidebar }) |surface| {
        try surface.describe(stdout);
        try stdout.print(" kind={s}\n", .{classify(surface.elevation)});
    }

    const heavier = maxSurface(Surface, view, sidebar);
    try stdout.print("heavier={s}\n", .{heavier.name});

    const optional: ?u32 = 42;
    const value = optional orelse 0;

    const numbers = .{ 42, -7, 1.5, 1.5e-9, 0x1C71D8 };
    const escaped = "tab\tnewline\nquote\"";
    const multiline =
        \\Line one
        \\Line two
    ;

    try stdout.print("{d} {s} {any}\n", .{ value, escaped, numbers });
    try stdout.print("{s}\n", .{multiline});
    try stdout.print("{s}\n", .{Palette.blue});
}
