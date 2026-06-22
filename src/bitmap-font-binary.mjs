function readAscii(buffer, offset, length) {
    return new TextDecoder('ascii').decode(buffer.slice(offset, offset + length));
}

function readCString(bytes, offset) {
    if (offset === 0) return '';
    let end = offset;
    while (end < bytes.length && bytes[end] !== 0) end++;
    return new TextDecoder('utf-8').decode(bytes.slice(offset, end));
}

function rowBytesToBits(bytes, width) {
    let bits = '';
    for (let col = 0; col < width; col++) {
        const byteIndex = col >> 3;
        const bitIndex = 7 - (col & 7);
        bits += ((bytes[byteIndex] >> bitIndex) & 1) ? '1' : '0';
    }
    return bits;
}

export function parseBitmapFontBinary(arrayBuffer, sourceName = 'BMFB') {
    const buffer = arrayBuffer instanceof ArrayBuffer ? arrayBuffer : arrayBuffer.buffer;
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    if (readAscii(bytes, 0, 4) !== 'BMFB') {
        throw new Error(`${sourceName}: invalid BMFB magic`);
    }

    const versionMajor = view.getUint16(4, true);
    const versionMinor = view.getUint16(6, true);
    const headerSize = view.getUint16(8, true);
    const alignment = view.getUint16(10, true);
    const fileSize = view.getUint32(12, true);
    const flags = view.getUint32(16, true);
    const encodingId = view.getUint32(20, true);
    const firstCodePoint = view.getUint32(24, true);
    const lastCodePoint = view.getUint32(28, true);
    const glyphCount = view.getUint32(32, true);
    const fallback = view.getUint32(36, true);
    const width = view.getUint16(40, true);
    const height = view.getUint16(42, true);
    const advance = view.getUint16(44, true);
    const baseline = view.getUint16(46, true);
    const rowStride = view.getUint16(48, true);
    const glyphRecordSize = view.getUint16(50, true);
    const glyphIndexOffset = view.getUint32(52, true);
    const glyphIndexSize = view.getUint32(56, true);
    const glyphDataOffset = view.getUint32(60, true);
    const glyphDataSize = view.getUint32(64, true);
    const stringTableOffset = view.getUint32(68, true);
    const stringTableSize = view.getUint32(72, true);
    const nameOffset = view.getUint32(76, true);
    const labelOffset = view.getUint32(80, true);
    const encodingNameOffset = view.getUint32(84, true);

    if (fileSize !== bytes.length) {
        throw new Error(`${sourceName}: file size mismatch`);
    }
    if (headerSize < 128 || alignment < 1 || glyphRecordSize < 16) {
        throw new Error(`${sourceName}: invalid header values`);
    }

    const glyphs = {};
    const glyphOrder = [];

    for (let index = 0; index < glyphCount; index++) {
        const recordOffset = glyphIndexOffset + index * glyphRecordSize;
        const codePoint = view.getUint32(recordOffset + 0, true);
        const dataOffset = view.getUint32(recordOffset + 4, true);
        const glyphWidth = view.getUint16(recordOffset + 8, true);
        const glyphHeight = view.getUint16(recordOffset + 10, true);
        const glyphAdvance = view.getUint16(recordOffset + 12, true);
        const glyphFlags = view.getUint16(recordOffset + 14, true);
        const rows = [];
        const absoluteDataOffset = glyphDataOffset + dataOffset;

        for (let row = 0; row < glyphHeight; row++) {
            const start = absoluteDataOffset + row * rowStride;
            rows.push(rowBytesToBits(bytes.slice(start, start + rowStride), glyphWidth));
        }

        glyphs[String(codePoint)] = rows;
        glyphOrder.push(codePoint);
    }

    const stringBytes = bytes.slice(stringTableOffset, stringTableOffset + stringTableSize);
    const encodingNames = new Map([
        [1, 'ASCII'],
        [2, 'ISO-8859-1'],
        [3, 'UNICODE']
    ]);

    return {
        schema: 'bitfont/bitmap-font/v1',
        sourceFormat: `BMFB ${versionMajor}.${versionMinor}`,
        id: readCString(stringBytes, nameOffset),
        label: readCString(stringBytes, labelOffset),
        script: 'binary',
        encoding: readCString(stringBytes, encodingNameOffset) || encodingNames.get(encodingId) || 'UNICODE',
        width,
        height,
        advance,
        baseline,
        range: [firstCodePoint, lastCodePoint],
        fallback,
        flags,
        blank: Array.from({ length: height }, () => '0'.repeat(width)),
        glyphs,
        glyphOrder
    };
}
