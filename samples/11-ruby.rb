#!/usr/bin/env ruby
# frozen_string_literal: true

# Ruby: blocks, symbols, heredocs, metaprogramming.
#
# Exercises: shebang comments, symbols, string interpolation, heredocs,
# blocks, modules, attr_accessor, constants, regexp, safe navigation.

require 'json'
require 'set'

module Gnome
  module Adwaita
    LEVELS = %i[view window sidebar dialog].freeze

    class Surface
      include Comparable

      attr_reader :name, :elevation
      attr_accessor :tones

      def initialize(name, elevation = 0, tones = [])
        raise ArgumentError, "name must not be blank" if name.nil? || name.empty?

        @name = name
        @elevation = elevation
        @tones = tones
      end

      def recessed?
        elevation < 2
      end

      def <=>(other)
        elevation <=> other.elevation
      end

      def to_s
        format("%s (level %d, %d tones)", name, elevation, tones.size)
      end
      alias inspect to_s

      class << self
        def build(names)
          names.map { |name| new(name) }
        end
      end
    end

    module Describable
      def describe
        "described: #{self}"
      end
    end
  end
end

surface = Gnome::Adwaita::Surface.new("sidebar", 2, %w[blue_3 teal_2])
puts surface
puts surface.recessed? ? "recessed" : "raised"
puts surface.describe

levels = Gnome::Adwaita::LEVELS
levels.each_with_index do |level, index|
  puts "#{index}: #{level}"
end

total = levels.reduce(0) { |sum, _level| sum + 1 }
puts total

heredoc = <<~JSON
  {
    "name": "#{surface.name}",
    "levels": #{levels.size}
  }
JSON

puts heredoc
puts JSON.parse(heredoc)["name"]

pattern = /^(adwaita|libadwaita)-(dark|light)$/i
puts "adwaita-dark".match?(pattern)
puts :blue_3.to_s.upcase
puts surface.tones&.first || "none"
puts defined?(surface) ? "defined" : "undefined"
