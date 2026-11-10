// Rust: the language with the most dedicated GtkSourceView styles.
//
// Exercises: attributes, lifetimes, macros, traits, impl blocks, generics,
// pattern matching, closures, references, raw strings, char literals.

#![allow(dead_code)]

use std::collections::HashMap;
use std::fmt;

/// A documented struct.
#[derive(Debug, Clone, PartialEq)]
pub struct Surface {
    pub name: String,
    pub elevation: u8,
    tones: Vec<u32>,
}

impl Surface {
    pub fn new(name: impl Into<String>, elevation: u8) -> Self {
        Self {
            name: name.into(),
            elevation,
            tones: Vec::new(),
        }
    }

    pub fn is_recessed(&self) -> bool {
        self.elevation < 2
    }
}

impl fmt::Display for Surface {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (elevation {})", self.name, self.elevation)
    }
}

pub trait Theme {
    const VARIANT: &'static str;

    fn background(&self) -> &'static str;

    fn describe(&self) -> String {
        format!("{}: {}", Self::VARIANT, self.background())
    }
}

struct Adwaita;

impl Theme for Adwaita {
    const VARIANT: &'static str = "Adwaita";

    fn background(&self) -> &'static str {
        "#1d1d20"
    }
}

macro_rules! tones {
    ($($name:ident => $value:expr),* $(,)?) => {
        $( const $name: u32 = $value; )*
    };
}

tones! {
    BLUE_3 => 0x3584e4,
    TEAL_2 => 0x5bc8af,
    ORANGE_2 => 0xffa348,
}

fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() {
        left
    } else {
        right
    }
}

fn main() {
    let mut registry: HashMap<&str, Surface> = HashMap::new();
    registry.insert("view", Surface::new("view", 0));
    registry.insert("sidebar", Surface::new("sidebar", 2));

    for (name, surface) in &registry {
        println!("{name} -> {surface} (recessed: {})", surface.is_recessed());
    }

    let names: Vec<&str> = registry.keys().copied().collect();
    match names.as_slice() {
        [] => println!("empty"),
        [only] => println!("one: {only}"),
        [first, .., last] => println!("{first} .. {last}"),
    }

    let raw = r"C:\path\to\adwaita";
    let byte = b'A';
    let character = '\u{1f600}';
    let escaped = "tab\tnewline\nquote\"";
    let float = 1.5e-9_f64;
    let boolean = true;

    println!("{raw} {byte} {character} {escaped} {float} {boolean}");
    println!("{}", longest("adwaita", "libadwaita"));
    println!("{}", Adwaita.describe());
}
