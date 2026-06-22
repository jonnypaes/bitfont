#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { align, packGlyphRows, readBmfFont } from './bitfont-toolkit.mjs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
    console.error('Usage: node tools/convert-bmf-to-bin.mjs <input.bmf> <output.bin>');
    process.exit(1);
}

const font = await readBmfFont(inputPath);
const alignment = 16;
const headerSize = 128;
const glyphRecordSize = 16;
const order = [...font.glyphOrder].sort((a, b) => a - b);
const rowStride = Math.ceil(font.width / 8);
const glyphData = [];
const records = [];

for (const codePoint of order) {
    const dataOffset = glyphData.length;
    glyphData.push(...packGlyphRows(font.glyphs[String(codePoint)], font.width));
    records.push({ codePoint, dataOffset, width: font.width, height: font.height, advance: font.advance, flags: 0 });
}

const glyphIndexOffset = align(headerSize, alignment);
const glyphIndexSize = records.length * glyphRecordSize;
const glyphDataOffset = align(glyphIndexOffset + glyphIndexSize, alignment);
const glyphDataSize = glyphData.length;
const stringTableOffset = align(glyphDataOffset + glyphDataSize, alignment);

function stringTable(strings) {
    const chunks = [Buffer.from([0])];
    const offsets = {};
    for (const [key, value] of Object.entries(strings)) {
        offsets[key] = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        chunks.push(Buffer.from(String(value), 'utf8'), Buffer.from([0]));
    }
    return { buffer: Buffer.concat(chunks), offsets };
}

const strings = stringTable({
    name: font.id,
    label: font.label,
    encoding: font.encoding
});
const stringTableSize = strings.buffer.length;
const fileSize = align(stringTableOffset + stringTableSize, alignment);
const buffer = Buffer.alloc(fileSize, 0);

function writeAscii(offset, text) { buffer.write(text, offset, 'ascii'); }
function u16(offset, value) { buffer.writeUInt16LE(value, offset); }
function u32(offset, value) { buffer.writeUInt32LE(value >>> 0, offset); }

const encodingId = font.encoding === 'ASCII' ? 1 : font.encoding === 'ISO-8859-1' ? 2 : 3;
const firstCodePoint = order[0] || 0;
const lastCodePoint = order[order.length - 1] || 0;

writeAscii(0, 'BMFB');
u16(4, 1);
u16(6, 0);
u16(8, headerSize);
u16(10, alignment);
u32(12, fileSize);
u32(16, 0);
u32(20, encodingId);
u32(24, firstCodePoint);
u32(28, lastCodePoint);
u32(32, records.length);
u32(36, font.fallback);
u16(40, font.width);
u16(42, font.height);
u16(44, font.advance);
u16(46, font.baseline);
u16(48, rowStride);
u16(50, glyphRecordSize);
u32(52, glyphIndexOffset);
u32(56, glyphIndexSize);
u32(60, glyphDataOffset);
u32(64, glyphDataSize);
u32(68, stringTableOffset);
u32(72, stringTableSize);
u32(76, strings.offsets.name);
u32(80, strings.offsets.label);
u32(84, strings.offsets.encoding);

for (let index = 0; index < records.length; index++) {
    const record = records[index];
    const offset = glyphIndexOffset + index * glyphRecordSize;
    u32(offset + 0, record.codePoint);
    u32(offset + 4, record.dataOffset);
    u16(offset + 8, record.width);
    u16(offset + 10, record.height);
    u16(offset + 12, record.advance);
    u16(offset + 14, record.flags);
}

Buffer.from(glyphData).copy(buffer, glyphDataOffset);
strings.buffer.copy(buffer, stringTableOffset);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, buffer);
