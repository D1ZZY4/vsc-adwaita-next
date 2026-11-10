/*
 * C: preprocessor directives, storage classes, type keywords, printf verbs.
 *
 * Exercises: block comments, preprocessor, storage classes, type keywords,
 * printf placeholders, character and string literals, numeric bases.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define ADWAITA_BLUE "#3584e4"
#define SURFACE_COUNT 4
#define MAX(a, b) ((a) > (b) ? (a) : (b))

typedef struct Surface {
	const char *name;
	unsigned char elevation;
} Surface;

enum Level {
	LEVEL_VIEW = 0,
	LEVEL_WINDOW,
	LEVEL_SIDEBAR,
	LEVEL_DIALOG,
};

static const Surface SURFACES[SURFACE_COUNT] = {
	{"view", LEVEL_VIEW},
	{"window", LEVEL_WINDOW},
	{"sidebar", LEVEL_SIDEBAR},
	{"dialog", LEVEL_DIALOG},
};

static inline int is_recessed(const Surface *surface)
{
	return surface->elevation < LEVEL_SIDEBAR;
}

int main(int argc, char *argv[])
{
	register int counter = 0;
	volatile unsigned int flags = 0x1c71d8u;
	signed char small = -8;
	long double precise = 1.5e-9L;

	for (int index = 0; index < SURFACE_COUNT; index++) {
		const Surface *surface = &SURFACES[index];
		counter += is_recessed(surface) ? 1 : 0;
		printf("[%d] %-8s level=%u recessed=%d\n", index, surface->name,
		       surface->elevation, is_recessed(surface));
	}

	printf("hex=%#x octal=%#o flags=%u precise=%Lg\n", 255, 8, flags, precise);
	printf("name=%s length=%zu first=%c escape=%s\n", ADWAITA_BLUE,
	       strlen(ADWAITA_BLUE), ADWAITA_BLUE[0], "tab\tnewline\n");
	printf("pointer=%p counter=%d max=%d\n", (void *)SURFACES, counter,
	       MAX(3, 7));

	if (argc > 1 && strcmp(argv[1], "--verbose") == 0) {
		fprintf(stderr, "verbose mode enabled\n");
	}

	return EXIT_SUCCESS;
}
