// Kotlin: data classes, coroutines, extension functions, null safety.
//
// Exercises: annotations, type keywords, string templates, null safety,
// extension functions, coroutines, when expressions, labelled returns.

package org.gnome.adwaita

import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay

const val MAX_TONES = 16
const val BLUE_HEX = 0x1C71D8
const val RATIO = 1.5e-9

enum class Level { VIEW, WINDOW, SIDEBAR, DIALOG }

interface Describer {
    val elevation: Int

    fun describe(): String

    val isRecessed: Boolean get() = elevation < 2
}

data class Surface(
    val name: String,
    val level: Level,
    val tones: List<String> = emptyList(),
) : Describer {
    override val elevation: Int get() = level.ordinal

    override fun describe(): String = "$name (level $elevation, ${tones.size} tones)"
}

sealed interface Shape {
    data class Circle(val radius: Double) : Shape
    data class Square(val side: Double) : Shape
}

fun Surface.withPrefix(prefix: String): String = "$prefix/$name"

suspend fun loadAll(names: List<String>): List<Surface> = coroutineScope {
    names.map { name ->
        async {
            delay(10)
            Surface(name = name, level = Level.VIEW)
        }
    }.map { it.await() }
}

fun classify(level: Level): String = when (level) {
    Level.VIEW -> "view"
    Level.WINDOW -> "window"
    Level.SIDEBAR, Level.DIALOG -> "chrome"
}

fun main() {
    val surfaces = listOf(
        Surface("view", Level.VIEW),
        Surface("sidebar", Level.SIDEBAR, listOf("blue_3", "teal_2")),
    )

    for (surface in surfaces) {
        println("${surface.describe()} recessed=${surface.isRecessed}")
        println(surface.withPrefix("adwaita"))
    }

    val required: String = surfaces.first().name
    val optional: String? = if (surfaces.isEmpty()) null else "non-empty"
    val length = optional?.length ?: 0

    val template = """
        {
          "name": "$required",
          "length": $length
        }
    """.trimIndent()

    println(template)
    println("hex=0x${BLUE_HEX.toString(16)} ratio=$RATIO max=$MAX_TONES")
    println(classify(Level.DIALOG))
}
