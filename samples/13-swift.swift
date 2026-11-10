// Swift: optionals, protocols, generics, property wrappers, result types.
//
// Exercises: attributes, optionals, protocols, generics, guard statements,
// string interpolation, closures, enums with associated values.

import Foundation

let maxTones = 16
let blueHex = 0x1C71D8
let ratio = 1.5e-9

enum Level: Int, CaseIterable {
    case view = 0
    case window
    case sidebar
    case dialog
}

protocol Describer {
    var elevation: Int { get }

    func describe() -> String

    var isRecessed: Bool { get }
}

extension Describer {
    var isRecessed: Bool {
        elevation < 2
    }
}

struct Surface: Describer {
    let name: String
    let level: Level
    var tones: [String] = []

    var elevation: Int {
        level.rawValue
    }

    func describe() -> String {
        "\(name) (level \(elevation), \(tones.count) tones)"
    }
}

@propertyWrapper
struct Clamped<Value: Comparable> {
    var wrappedValue: Value {
        didSet {
            wrappedValue = min(max(wrappedValue, range.lowerBound), range.upperBound)
        }
    }

    let range: ClosedRange<Value>

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.wrappedValue = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }
}

enum Shape {
    case circle(radius: Double)
    case square(side: Double)

    var area: Double {
        switch self {
        case let .circle(radius):
            return .pi * radius * radius
        case let .square(side):
            return side * side
        }
    }
}

func loadAll(_ names: [String]) async throws -> [Surface] {
    try await withThrowingTaskGroup(of: Surface.self) { group in
        for name in names {
            group.addTask {
                Surface(name: name, level: .view)
            }
        }
        return try await group.reduce(into: []) { $0.append($1) }
    }
}

@available(macOS 12, *)
func classify(_ level: Level) -> String {
    switch level {
    case .view:
        return "view"
    case .window:
        return "window"
    case .sidebar, .dialog:
        return "chrome"
    }
}

let surfaces = [
    Surface(name: "view", level: .view),
    Surface(name: "sidebar", level: .sidebar, tones: ["blue_3", "teal_2"]),
]

for surface in surfaces {
    print("\(surface.describe()) recessed=\(surface.isRecessed)")
}

let label = classify(.dialog)
let json = """
    {
        "label": "\(label)",
        "count": \(surfaces.count)
    }
    """

print(json)

guard let first = surfaces.first else {
    fatalError("no surfaces")
}

print(first.name)
print(String(format: "hex=%#x ratio=%.1e", blueHex, ratio))
print(maxTones)
