export function parseIntegerToken(token, sourceName = 'BMF') {
    if (/^U\+[0-9a-fA-F]+$/.test(token)) {
        return parseInt(token.slice(2), 16);
    }
    if (/^0x[0-9a-fA-F]+$/.test(token)) {
        return parseInt(token.slice(2), 16);
    }
    if (/^[0-9]+$/.test(token)) {
        return parseInt(token, 10);
    }
    throw new Error(`${sourceName}: invalid integer token: ${token}`);
}

function parseRange(value) {
    if (!value) return null;
    const parts = value.trim().split(/\s+/);
    if (parts.length !== 2) return null;
    return [parseIntegerToken(parts[0]), parseIntegerToken(parts[1])];
}

function createBlank(width, height) {
    return Array.from({ length: height }, () => '0'.repeat(width));
}

export function parseBitmapFontBmf(text, sourceName = 'BMF') {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const meta = new Map();
    const glyphs = {};
    const glyphNames = {};
    const glyphOrder = [];

    let cursor = 0;
    while (cursor < lines.length && lines[cursor].trim() === '') cursor++;
    if (lines[cursor]?.trim() !== 'BMF 1') {
        throw new Error(`${sourceName}: expected BMF 1 header`);
    }
    cursor++;

    while (cursor < lines.length) {
        const raw = lines[cursor];
        const line = raw.trim();
        cursor++;
        if (!line || line.startsWith('#')) continue;

        if (line.startsWith('GLYPH ')) {
            const parts = line.split(/\s+/);
            const codePoint = parseIntegerToken(parts[1], sourceName);
            const glyphName = parts.slice(2).join('_') || `U_${codePoint.toString(16).toUpperCase()}`;
            const rows = [];

            while (cursor < lines.length) {
                const glyphLine = lines[cursor].trim();
                cursor++;
                if (!glyphLine || glyphLine.startsWith('#')) continue;
                if (glyphLine === 'END') break;
                if (!/^[01]+$/.test(glyphLine)) {
                    throw new Error(`${sourceName}: invalid bitmap row for ${parts[1]}: ${glyphLine}`);
                }
                rows.push(glyphLine);
            }

            glyphs[String(codePoint)] = rows;
            glyphNames[String(codePoint)] = glyphName;
            glyphOrder.push(codePoint);
            continue;
        }

        const firstSpace = line.search(/\s/);
        const key = firstSpace === -1 ? line : line.slice(0, firstSpace);
        const value = firstSpace === -1 ? '' : line.slice(firstSpace + 1).trim();
        meta.set(key, value);
    }

    const width = Number(meta.get('WIDTH'));
    const height = Number(meta.get('HEIGHT'));
    const advance = Number(meta.get('ADVANCE') || width);
    const baseline = Number(meta.get('BASELINE') || height);
    const fallback = parseIntegerToken(meta.get('FALLBACK') || '0x3F', sourceName);
    const range = parseRange(meta.get('RANGE'));

    if (!Number.isInteger(width) || width <= 0) throw new Error(`${sourceName}: invalid WIDTH`);
    if (!Number.isInteger(height) || height <= 0) throw new Error(`${sourceName}: invalid HEIGHT`);

    for (const [codePoint, rows] of Object.entries(glyphs)) {
        if (rows.length !== height) {
            throw new Error(`${sourceName}: glyph ${codePoint} has ${rows.length} rows, expected ${height}`);
        }
        for (const row of rows) {
            if (row.length !== width) {
                throw new Error(`${sourceName}: glyph ${codePoint} has row width ${row.length}, expected ${width}`);
            }
        }
    }

    const blank = createBlank(width, height);

    return {
        schema: 'bitfont/bitmap-font/v1',
        sourceFormat: 'BMF 1',
        id: meta.get('NAME') || 'bitmap_font',
        label: meta.get('LABEL') || meta.get('NAME') || 'Bitmap Font',
        script: meta.get('SCRIPT') || 'unknown',
        encoding: meta.get('ENCODING') || 'UNICODE',
        width,
        height,
        advance,
        baseline,
        range,
        fallback,
        features: (meta.get('FEATURES') || '').split(',').map((item) => item.trim()).filter(Boolean),
        blank,
        glyphs,
        glyphNames,
        glyphOrder
    };
}
