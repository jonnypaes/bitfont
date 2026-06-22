#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { packGlyphRows, readBmfFont, sanitizeIdentifier } from './bitfont-toolkit.mjs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
    console.error('Usage: node tools/convert-bmf-to-c-header.mjs <input.bmf> <output.h>');
    process.exit(1);
}

const font = await readBmfFont(inputPath);
const symbol = sanitizeIdentifier(font.id);
const guard = `${symbol.toUpperCase()}_H`;
const order = [...font.glyphOrder].sort((a, b) => a - b);
const rowStride = Math.ceil(font.width / 8);
const glyphBytes = rowStride * font.height;
const data = [];
const records = [];

for (const codePoint of order) {
    const offset = data.length;
    const bytes = packGlyphRows(font.glyphs[String(codePoint)], font.width);
    data.push(...bytes);
    records.push({ codePoint, offset, width: font.width, height: font.height, advance: font.advance, flags: 0 });
}

function hex(value, width = 2) {
    return `0x${value.toString(16).toUpperCase().padStart(width, '0')}`;
}

function wrapBytes(values) {
    const lines = [];
    for (let index = 0; index < values.length; index += 12) {
        lines.push(`    ${values.slice(index, index + 12).map((value) => hex(value)).join(', ')}`);
    }
    return lines.join(',\n');
}

const text = `#ifndef ${guard}
#define ${guard}

#include <stddef.h>
#include <stdint.h>

#define ${symbol.toUpperCase()}_WIDTH ${font.width}u
#define ${symbol.toUpperCase()}_HEIGHT ${font.height}u
#define ${symbol.toUpperCase()}_ADVANCE ${font.advance}u
#define ${symbol.toUpperCase()}_BASELINE ${font.baseline}u
#define ${symbol.toUpperCase()}_ROW_STRIDE ${rowStride}u
#define ${symbol.toUpperCase()}_GLYPH_COUNT ${records.length}u
#define ${symbol.toUpperCase()}_FALLBACK_CODEPOINT ${hex(font.fallback, 4)}u

typedef struct ${symbol}_glyph_record {
    uint32_t codepoint;
    uint32_t data_offset;
    uint16_t width;
    uint16_t height;
    uint16_t advance;
    uint16_t flags;
} ${symbol}_glyph_record_t;

static const uint8_t ${symbol}_glyph_data[] = {
${wrapBytes(data)}
};

static const ${symbol}_glyph_record_t ${symbol}_glyph_records[] = {
${records.map((record) => `    { ${hex(record.codePoint, 4)}u, ${record.offset}u, ${record.width}u, ${record.height}u, ${record.advance}u, ${record.flags}u }`).join(',\n')}
};

static inline const ${symbol}_glyph_record_t *${symbol}_find_glyph(uint32_t codepoint) {
    size_t left = 0;
    size_t right = ${symbol.toUpperCase()}_GLYPH_COUNT;

    while (left < right) {
        size_t mid = left + ((right - left) / 2u);
        uint32_t current = ${symbol}_glyph_records[mid].codepoint;

        if (current == codepoint) {
            return &${symbol}_glyph_records[mid];
        }
        if (current < codepoint) {
            left = mid + 1u;
        } else {
            right = mid;
        }
    }

    return NULL;
}

static inline const ${symbol}_glyph_record_t *${symbol}_glyph(uint32_t codepoint) {
    const ${symbol}_glyph_record_t *glyph = ${symbol}_find_glyph(codepoint);
    if (glyph != NULL) {
        return glyph;
    }
    return ${symbol}_find_glyph(${symbol.toUpperCase()}_FALLBACK_CODEPOINT);
}

static inline uint8_t ${symbol}_pixel(const ${symbol}_glyph_record_t *glyph, uint16_t x, uint16_t y) {
    if (glyph == NULL || x >= glyph->width || y >= glyph->height) {
        return 0u;
    }

    const uint32_t offset = glyph->data_offset + ((uint32_t)y * ${symbol.toUpperCase()}_ROW_STRIDE) + ((uint32_t)x / 8u);
    const uint8_t byte = ${symbol}_glyph_data[offset];
    const uint8_t bit = (uint8_t)(7u - (x & 7u));
    return (uint8_t)((byte >> bit) & 1u);
}

#endif
`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, text, 'utf8');
