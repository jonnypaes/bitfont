const CONTROL_NAMES = new Map([
    [0x00, 'NUL'], [0x01, 'SOH'], [0x02, 'STX'], [0x03, 'ETX'],
    [0x04, 'EOT'], [0x05, 'ENQ'], [0x06, 'ACK'], [0x07, 'BEL'],
    [0x08, 'BS'], [0x09, 'TAB'], [0x0A, 'LF'], [0x0B, 'VT'],
    [0x0C, 'FF'], [0x0D, 'CR'], [0x0E, 'SO'], [0x0F, 'SI'],
    [0x10, 'DLE'], [0x11, 'DC1'], [0x12, 'DC2'], [0x13, 'DC3'],
    [0x14, 'DC4'], [0x15, 'NAK'], [0x16, 'SYN'], [0x17, 'ETB'],
    [0x18, 'CAN'], [0x19, 'EM'], [0x1A, 'SUB'], [0x1B, 'ESC'],
    [0x1C, 'FS'], [0x1D, 'GS'], [0x1E, 'RS'], [0x1F, 'US'],
    [0x20, 'SPACE'], [0x7F, 'DEL'], [0xA0, 'NBSP']
]);

const ASCII_NAME_OVERRIDES = new Map([
    [0x21, 'EXCLAMATION_MARK'], [0x22, 'QUOTATION_MARK'], [0x23, 'NUMBER_SIGN'],
    [0x24, 'DOLLAR_SIGN'], [0x25, 'PERCENT_SIGN'], [0x26, 'AMPERSAND'],
    [0x27, 'APOSTROPHE'], [0x28, 'LEFT_PARENTHESIS'], [0x29, 'RIGHT_PARENTHESIS'],
    [0x2A, 'ASTERISK'], [0x2B, 'PLUS_SIGN'], [0x2C, 'COMMA'], [0x2D, 'HYPHEN_MINUS'],
    [0x2E, 'FULL_STOP'], [0x2F, 'SOLIDUS'], [0x3A, 'COLON'], [0x3B, 'SEMICOLON'],
    [0x3C, 'LESS_THAN_SIGN'], [0x3D, 'EQUALS_SIGN'], [0x3E, 'GREATER_THAN_SIGN'],
    [0x3F, 'QUESTION_MARK'], [0x40, 'COMMERCIAL_AT'], [0x5B, 'LEFT_SQUARE_BRACKET'],
    [0x5C, 'REVERSE_SOLIDUS'], [0x5D, 'RIGHT_SQUARE_BRACKET'], [0x5E, 'CIRCUMFLEX_ACCENT'],
    [0x5F, 'LOW_LINE'], [0x60, 'GRAVE_ACCENT'], [0x7B, 'LEFT_CURLY_BRACKET'],
    [0x7C, 'VERTICAL_LINE'], [0x7D, 'RIGHT_CURLY_BRACKET'], [0x7E, 'TILDE']
]);

const LATIN1_NAMES = new Map([
    [0xA1, 'INVERTED_EXCLAMATION_MARK'], [0xA2, 'CENT_SIGN'], [0xA3, 'POUND_SIGN'],
    [0xA4, 'CURRENCY_SIGN'], [0xA5, 'YEN_SIGN'], [0xA6, 'BROKEN_BAR'], [0xA7, 'SECTION_SIGN'],
    [0xA8, 'DIAERESIS'], [0xA9, 'COPYRIGHT_SIGN'], [0xAA, 'FEMININE_ORDINAL_INDICATOR'],
    [0xAB, 'LEFT_POINTING_DOUBLE_ANGLE_QUOTATION_MARK'], [0xAC, 'NOT_SIGN'], [0xAD, 'SOFT_HYPHEN'],
    [0xAE, 'REGISTERED_SIGN'], [0xAF, 'MACRON'], [0xB0, 'DEGREE_SIGN'], [0xB1, 'PLUS_MINUS_SIGN'],
    [0xB2, 'SUPERSCRIPT_TWO'], [0xB3, 'SUPERSCRIPT_THREE'], [0xB4, 'ACUTE_ACCENT'],
    [0xB5, 'MICRO_SIGN'], [0xB6, 'PILCROW_SIGN'], [0xB7, 'MIDDLE_DOT'], [0xB8, 'CEDILLA'],
    [0xB9, 'SUPERSCRIPT_ONE'], [0xBA, 'MASCULINE_ORDINAL_INDICATOR'],
    [0xBB, 'RIGHT_POINTING_DOUBLE_ANGLE_QUOTATION_MARK'], [0xBC, 'VULGAR_FRACTION_ONE_QUARTER'],
    [0xBD, 'VULGAR_FRACTION_ONE_HALF'], [0xBE, 'VULGAR_FRACTION_THREE_QUARTERS'],
    [0xBF, 'INVERTED_QUESTION_MARK']
]);

function sortedCodePoints(font) {
    const order = font.glyphOrder && font.glyphOrder.length > 0
        ? font.glyphOrder
        : Object.keys(font.glyphs || {}).map((value) => Number(value));
    return [...new Set(order)].filter(Number.isFinite).sort((a, b) => a - b);
}

function sanitizeIdentifier(value) {
    return String(value || 'bitmap_font').replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
}

function codeToken(codePoint) {
    if (codePoint <= 0xFF) {
        return `0x${codePoint.toString(16).toUpperCase().padStart(2, '0')}`;
    }
    return `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

function glyphName(font, codePoint) {
    const key = String(codePoint);
    const explicit = font.glyphNames?.[key] || font.glyphAnchors?.[key];
    if (explicit) return sanitizeIdentifier(explicit).toUpperCase();
    if (CONTROL_NAMES.has(codePoint)) return CONTROL_NAMES.get(codePoint);
    if (codePoint >= 0x30 && codePoint <= 0x39) return String.fromCodePoint(codePoint);
    if (codePoint >= 0x41 && codePoint <= 0x5A) return String.fromCodePoint(codePoint);
    if (codePoint >= 0x61 && codePoint <= 0x7A) return String.fromCodePoint(codePoint);
    if (ASCII_NAME_OVERRIDES.has(codePoint)) return ASCII_NAME_OVERRIDES.get(codePoint);
    if (LATIN1_NAMES.has(codePoint)) return LATIN1_NAMES.get(codePoint);
    return `U_${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

function rangeFor(font, order) {
    if (Array.isArray(font.range) && font.range.length === 2) return font.range;
    if (order.length === 0) return [0, 0];
    return [order[0], order[order.length - 1]];
}

function packGlyphRows(rows, width) {
    const rowStride = Math.ceil(width / 8);
    const bytes = [];
    for (const row of rows) {
        for (let byteIndex = 0; byteIndex < rowStride; byteIndex += 1) {
            let value = 0;
            for (let bit = 0; bit < 8; bit += 1) {
                const col = byteIndex * 8 + bit;
                if (col < width && row[col] === '1') value |= 1 << (7 - bit);
            }
            bytes.push(value);
        }
    }
    return bytes;
}

function align(value, alignment) {
    return Math.ceil(value / alignment) * alignment;
}

function writeAscii(bytes, offset, text) {
    for (let index = 0; index < text.length; index += 1) {
        bytes[offset + index] = text.charCodeAt(index) & 0x7F;
    }
}

function writeCStringParts(strings) {
    const encoder = new TextEncoder();
    const chunks = [new Uint8Array([0])];
    const offsets = {};
    for (const [key, value] of Object.entries(strings)) {
        offsets[key] = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        chunks.push(encoder.encode(String(value)), new Uint8Array([0]));
    }
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let cursor = 0;
    for (const chunk of chunks) {
        out.set(chunk, cursor);
        cursor += chunk.length;
    }
    return { bytes: out, offsets };
}

function u16(view, offset, value) {
    view.setUint16(offset, value, true);
}

function u32(view, offset, value) {
    view.setUint32(offset, value >>> 0, true);
}

export function serializeFontAsJson(font) {
    const order = sortedCodePoints(font);
    return `${JSON.stringify({
        ...font,
        schema: font.schema || 'bitfont/bitmap-font/v1',
        glyphOrder: order,
        glyphAnchors: font.glyphAnchors || font.glyphNames || {}
    }, null, 2)}\n`;
}

export function serializeFontAsBmf(font) {
    const order = sortedCodePoints(font);
    const [rangeStart, rangeEnd] = rangeFor(font, order);
    const lines = [
        'BMF 1',
        `NAME ${font.id || 'bitmap_font'}`,
        `LABEL ${font.label || font.id || 'Bitmap Font'}`,
        `SCRIPT ${font.script || 'custom'}`,
        `ENCODING ${font.encoding || 'UNICODE'}`,
        `WIDTH ${font.width}`,
        `HEIGHT ${font.height}`,
        `ADVANCE ${font.advance || font.width}`,
        `BASELINE ${font.baseline || font.height}`,
        `RANGE ${codeToken(rangeStart)} ${codeToken(rangeEnd)}`,
        `FALLBACK ${codeToken(font.fallback || 0x3F)}`
    ];

    if (Array.isArray(font.features) && font.features.length > 0) {
        lines.push(`FEATURES ${font.features.join(',')}`);
    }

    lines.push('');

    for (const codePoint of order) {
        const glyph = font.glyphs[String(codePoint)];
        if (!glyph) continue;
        lines.push(`GLYPH ${codeToken(codePoint)} ${glyphName(font, codePoint)}`);
        lines.push(...glyph);
        lines.push('END', '');
    }

    return `${lines.join('\n')}\n`;
}

export function serializeFontAsCHeader(font) {
    const symbol = sanitizeIdentifier(font.id || 'bitmap_font');
    const guard = `${symbol.toUpperCase()}_H`;
    const order = sortedCodePoints(font);
    const rowStride = Math.ceil(font.width / 8);
    const data = [];
    const records = [];

    for (const codePoint of order) {
        const glyph = font.glyphs[String(codePoint)];
        if (!glyph) continue;
        const offset = data.length;
        data.push(...packGlyphRows(glyph, font.width));
        records.push({ codePoint, offset, width: font.width, height: font.height, advance: font.advance || font.width, flags: 0 });
    }

    const hex = (value, width = 2) => `0x${value.toString(16).toUpperCase().padStart(width, '0')}`;
    const byteLines = [];
    for (let index = 0; index < data.length; index += 12) {
        byteLines.push(`    ${data.slice(index, index + 12).map((value) => hex(value)).join(', ')}`);
    }

    return `#ifndef ${guard}\n#define ${guard}\n\n#include <stddef.h>\n#include <stdint.h>\n\n#define ${symbol.toUpperCase()}_WIDTH ${font.width}u\n#define ${symbol.toUpperCase()}_HEIGHT ${font.height}u\n#define ${symbol.toUpperCase()}_ADVANCE ${(font.advance || font.width)}u\n#define ${symbol.toUpperCase()}_BASELINE ${(font.baseline || font.height)}u\n#define ${symbol.toUpperCase()}_ROW_STRIDE ${rowStride}u\n#define ${symbol.toUpperCase()}_GLYPH_COUNT ${records.length}u\n#define ${symbol.toUpperCase()}_FALLBACK_CODEPOINT ${hex(font.fallback || 0x3F, 4)}u\n\ntypedef struct ${symbol}_glyph_record {\n    uint32_t codepoint;\n    uint32_t data_offset;\n    uint16_t width;\n    uint16_t height;\n    uint16_t advance;\n    uint16_t flags;\n} ${symbol}_glyph_record_t;\n\nstatic const uint8_t ${symbol}_glyph_data[] = {\n${byteLines.join(',\n')}\n};\n\nstatic const ${symbol}_glyph_record_t ${symbol}_glyph_records[] = {\n${records.map((record) => `    { ${hex(record.codePoint, 4)}u, ${record.offset}u, ${record.width}u, ${record.height}u, ${record.advance}u, ${record.flags}u }`).join(',\n')}\n};\n\nstatic inline const ${symbol}_glyph_record_t *${symbol}_find_glyph(uint32_t codepoint) {\n    size_t left = 0;\n    size_t right = ${symbol.toUpperCase()}_GLYPH_COUNT;\n\n    while (left < right) {\n        size_t mid = left + ((right - left) / 2u);\n        uint32_t current = ${symbol}_glyph_records[mid].codepoint;\n        if (current == codepoint) return &${symbol}_glyph_records[mid];\n        if (current < codepoint) left = mid + 1u;\n        else right = mid;\n    }\n\n    return NULL;\n}\n\nstatic inline const ${symbol}_glyph_record_t *${symbol}_glyph(uint32_t codepoint) {\n    const ${symbol}_glyph_record_t *glyph = ${symbol}_find_glyph(codepoint);\n    if (glyph != NULL) return glyph;\n    return ${symbol}_find_glyph(${symbol.toUpperCase()}_FALLBACK_CODEPOINT);\n}\n\nstatic inline uint8_t ${symbol}_pixel(const ${symbol}_glyph_record_t *glyph, uint16_t x, uint16_t y) {\n    if (glyph == NULL || x >= glyph->width || y >= glyph->height) return 0u;\n    const uint32_t offset = glyph->data_offset + ((uint32_t)y * ${symbol.toUpperCase()}_ROW_STRIDE) + ((uint32_t)x / 8u);\n    const uint8_t byte = ${symbol}_glyph_data[offset];\n    const uint8_t bit = (uint8_t)(7u - (x & 7u));\n    return (uint8_t)((byte >> bit) & 1u);\n}\n\n#endif\n`;
}

export function serializeFontAsBmfb(font) {
    const alignment = 16;
    const headerSize = 128;
    const glyphRecordSize = 16;
    const order = sortedCodePoints(font);
    const rowStride = Math.ceil(font.width / 8);
    const glyphData = [];
    const records = [];

    for (const codePoint of order) {
        const glyph = font.glyphs[String(codePoint)];
        if (!glyph) continue;
        const dataOffset = glyphData.length;
        glyphData.push(...packGlyphRows(glyph, font.width));
        records.push({ codePoint, dataOffset, width: font.width, height: font.height, advance: font.advance || font.width, flags: 0 });
    }

    const glyphIndexOffset = align(headerSize, alignment);
    const glyphIndexSize = records.length * glyphRecordSize;
    const glyphDataOffset = align(glyphIndexOffset + glyphIndexSize, alignment);
    const glyphDataSize = glyphData.length;
    const stringTableOffset = align(glyphDataOffset + glyphDataSize, alignment);
    const strings = writeCStringParts({ name: font.id || 'bitmap_font', label: font.label || font.id || 'Bitmap Font', encoding: font.encoding || 'UNICODE' });
    const stringTableSize = strings.bytes.length;
    const fileSize = align(stringTableOffset + stringTableSize, alignment);
    const bytes = new Uint8Array(fileSize);
    const view = new DataView(bytes.buffer);
    const encoding = String(font.encoding || '').toUpperCase();
    const encodingId = encoding === 'ASCII' ? 1 : encoding === 'ISO-8859-1' || encoding === 'ISO_8859_1' ? 2 : 3;

    writeAscii(bytes, 0, 'BMFB');
    u16(view, 4, 1); u16(view, 6, 0); u16(view, 8, headerSize); u16(view, 10, alignment);
    u32(view, 12, fileSize); u32(view, 16, 0); u32(view, 20, encodingId);
    u32(view, 24, records[0]?.codePoint || 0); u32(view, 28, records.length > 0 ? records[records.length - 1].codePoint : 0);
    u32(view, 32, records.length); u32(view, 36, font.fallback || 0x3F);
    u16(view, 40, font.width); u16(view, 42, font.height); u16(view, 44, font.advance || font.width);
    u16(view, 46, font.baseline || font.height); u16(view, 48, rowStride); u16(view, 50, glyphRecordSize);
    u32(view, 52, glyphIndexOffset); u32(view, 56, glyphIndexSize); u32(view, 60, glyphDataOffset);
    u32(view, 64, glyphDataSize); u32(view, 68, stringTableOffset); u32(view, 72, stringTableSize);
    u32(view, 76, strings.offsets.name); u32(view, 80, strings.offsets.label); u32(view, 84, strings.offsets.encoding);

    for (let index = 0; index < records.length; index += 1) {
        const record = records[index];
        const offset = glyphIndexOffset + index * glyphRecordSize;
        u32(view, offset + 0, record.codePoint);
        u32(view, offset + 4, record.dataOffset);
        u16(view, offset + 8, record.width);
        u16(view, offset + 10, record.height);
        u16(view, offset + 12, record.advance);
        u16(view, offset + 14, record.flags);
    }

    bytes.set(glyphData, glyphDataOffset);
    bytes.set(strings.bytes, stringTableOffset);
    return bytes.buffer;
}

export function serializeFontAsBmp(font, options = {}) {
    const scale = options.scale || 2;
    const columns = options.columns || 16;
    const order = sortedCodePoints(font);
    const rows = Math.max(1, Math.ceil(order.length / columns));
    const cellWidth = (font.width + 2) * scale;
    const cellHeight = (font.height + 2) * scale;
    const width = columns * cellWidth;
    const height = rows * cellHeight;
    const rowStride = Math.ceil(width / 4) * 4;
    const pixelDataSize = rowStride * height;
    const paletteSize = 256 * 4;
    const headerSize = 14 + 40 + paletteSize;
    const fileSize = headerSize + pixelDataSize;
    const bytes = new Uint8Array(fileSize);
    const view = new DataView(bytes.buffer);

    writeAscii(bytes, 0, 'BM');
    u32(view, 2, fileSize); u32(view, 10, headerSize); u32(view, 14, 40);
    view.setInt32(18, width, true); view.setInt32(22, height, true);
    u16(view, 26, 1); u16(view, 28, 8); u32(view, 30, 0); u32(view, 34, pixelDataSize);
    view.setInt32(38, 2835, true); view.setInt32(42, 2835, true); u32(view, 46, 256); u32(view, 50, 0);

    const paletteOffset = 14 + 40;
    bytes[paletteOffset + 255 * 4 + 0] = 255;
    bytes[paletteOffset + 255 * 4 + 1] = 255;
    bytes[paletteOffset + 255 * 4 + 2] = 255;
    const pixelOffset = headerSize;

    function setPixel(x, y, value) {
        const bmpY = height - 1 - y;
        bytes[pixelOffset + bmpY * rowStride + x] = value;
    }

    for (let index = 0; index < order.length; index += 1) {
        const codePoint = order[index];
        const glyph = font.glyphs[String(codePoint)];
        if (!glyph) continue;
        const gridX = index % columns;
        const gridY = Math.floor(index / columns);
        const baseX = gridX * cellWidth + scale;
        const baseY = gridY * cellHeight + scale;
        for (let row = 0; row < glyph.length; row += 1) {
            for (let col = 0; col < glyph[row].length; col += 1) {
                if (glyph[row][col] !== '1') continue;
                for (let sy = 0; sy < scale; sy += 1) {
                    for (let sx = 0; sx < scale; sx += 1) {
                        setPixel(baseX + col * scale + sx, baseY + row * scale + sy, 255);
                    }
                }
            }
        }
    }

    return bytes.buffer;
}

export function exportPayload(font, format) {
    switch (format) {
        case 'json': return { data: serializeFontAsJson(font), mime: 'application/json', extension: 'json' };
        case 'bmf': return { data: serializeFontAsBmf(font), mime: 'text/plain', extension: 'bmf' };
        case 'bin': return { data: serializeFontAsBmfb(font), mime: 'application/octet-stream', extension: 'bin' };
        case 'h': return { data: serializeFontAsCHeader(font), mime: 'text/x-csrc', extension: 'h' };
        case 'bmp': return { data: serializeFontAsBmp(font), mime: 'image/bmp', extension: 'bmp' };
        default: throw new Error(`Unsupported export format: ${format}`);
    }
}
