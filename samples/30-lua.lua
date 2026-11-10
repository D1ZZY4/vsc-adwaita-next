-- Lua: tables, metatables, closures, varargs, string patterns.
-- Exercises: comments, tables, metatables, closures, varargs, string
-- patterns, numeric literals, operators, conditionals.

local Surfaces = {}
Surfaces.__index = Surfaces

local LEVELS = { view = 0, window = 1, sidebar = 2, dialog = 3 }
local PALETTE = { blue = "#3584e4", teal = "#5bc8af", orange = "#ffa348" }

Surfaces.DEFAULT_ELEVATION = 0
Surfaces.MAX_TONES = 16

function Surfaces.new(name, elevation, tones)
  elevation = elevation or Surfaces.DEFAULT_ELEVATION
  tones = tones or {}

  return setmetatable({
    name = name,
    elevation = elevation,
    tones = tones,
  }, Surfaces)
end

function Surfaces:isRecessed()
  return self.elevation < 2
end

function Surfaces:describe()
  return string.format("%s (level %d, %d tones)", self.name, self.elevation, #self.tones)
end

setmetatable(Surfaces, {
  __call = function(_, name, elevation, tones)
    return Surfaces.new(name, elevation, tones)
  end,
})

local function classify(elevation)
  if elevation < 2 then
    return "recessed"
  elseif elevation == 3 then
    return "overlay"
  else
    return "chrome"
  end
end

local function mapAll(list, fn)
  local result = {}
  for index, value in ipairs(list) do
    result[index] = fn(value, index)
  end
  return result
end

local names = { "view", "window", "sidebar", "dialog" }

local surfaces = mapAll(names, function(name, index)
  return Surfaces(name, index - 1, { "blue_3", "teal_2" })
end)

for _, surface in ipairs(surfaces) do
  print(string.format("%-8s %s kind=%s", surface.name, surface:describe(), classify(surface.elevation)))
end

local numbers = {
  integer = 42,
  negative = -7,
  float = 1.5,
  exponent = 1.5e-9,
  hex = 0x1C71D8,
}

local escaped = "tab\tnewline\nquote\"backslash\\"
local multiline = [[
A long bracket string
with no escapes \n
]]

local pattern = "^(adwaita)%-(%a+)$"
local matched = string.match("adwaita-dark", pattern)
print(matched, escaped, multiline, numbers.hex)

local function varargs(...)
  local count = select("#", ...)
  local first = ...
  return count, first
end

print(varargs("adwaita", "libadwaita"))

local ok, err = pcall(function()
  error("something went wrong")
end)
print(ok, err)
