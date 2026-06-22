#include <stdint.h>
#include <stdio.h>

#include "../../dist/include/ascii/terminal/font_terminal_ascii_5x7.h"

int main(void) {
    const font_terminal_ascii_5x7_glyph_record_t *glyph = font_terminal_ascii_5x7_glyph('A');

    for (uint16_t y = 0; y < FONT_TERMINAL_ASCII_5X7_HEIGHT; y++) {
        for (uint16_t x = 0; x < FONT_TERMINAL_ASCII_5X7_WIDTH; x++) {
            putchar(font_terminal_ascii_5x7_pixel(glyph, x, y) ? '#' : '.');
        }
        putchar('\n');
    }

    return 0;
}
