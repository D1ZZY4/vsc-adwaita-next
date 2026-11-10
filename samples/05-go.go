// Go: structs, interfaces, goroutines and printf verbs.
//
// Exercises: predeclared types, printf placeholders, struct tags, generics,
// channels, goroutines, method receivers, iota.

package main

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

// Surface is a named workbench surface.
type Surface struct {
	Name      string `json:"name"`
	Elevation uint8  `json:"elevation"`
	mu        sync.RWMutex
}

// ErrNotFound is returned when a surface is missing.
var ErrNotFound = errors.New("surface not found")

const (
	LevelView uint8 = iota
	LevelWindow
	LevelSidebar
	LevelDialog
)

type Describer interface {
	Describe() string
	Recessed() bool
}

func (s *Surface) Describe() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return fmt.Sprintf("%s (level %d)", s.Name, s.Elevation)
}

func (s *Surface) Recessed() bool {
	return s.Elevation < LevelSidebar
}

func Map[T any, U any](in []T, fn func(T) U) []U {
	out := make([]U, 0, len(in))
	for _, value := range in {
		out = append(out, fn(value))
	}
	return out
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	surfaces := []Surface{
		{Name: "view", Elevation: LevelView},
		{Name: "sidebar", Elevation: LevelSidebar},
	}

	results := make(chan string, len(surfaces))

	go func() {
		defer close(results)
		for index := range surfaces {
			surface := &surfaces[index]
			select {
			case results <- surface.Describe():
			case <-ctx.Done():
				return
			}
		}
	}()

	for result := range results {
		fmt.Printf("got: %s\n", result)
	}

	names := Map(surfaces, func(s Surface) string { return s.Name })
	fmt.Printf("names=%v count=%d err=%v\n", names, len(names), ErrNotFound)
	fmt.Printf("hex=%#x octal=%#o binary=%#b float=%.3f quoted=%q\n", 255, 8, 5, 1.5, "adwaita")

	var (
		typed   int     = 42
		untyped         = 'A'
		flag    bool    = true
		ratio   float64 = 0.75
	)
	fmt.Println(typed, untyped, flag, ratio)
}
