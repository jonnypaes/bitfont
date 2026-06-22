#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readBmfFont } from './bitfont-toolkit.mjs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
    console.error('Usage: node tools/convert-bmf-to-bmp.mjs <input.bmf> <output.bmp>');
    process.exit(1);
}

const font = await readBmfFont(inputPath);
const scale = 2;
const columns = 16;
const glyphOrder = [...font.glyphOrder].sort((a, b) => a - b);
const rows = Math.ceil(glyphOrder.length / columns);
const cellWidth = (font.width + 2) * scale;
const cellHeight = (font.height + 2) * scale;
const width = columns * cellWidth;
const height = rows * cellHeight;
const rowStride = Math.ceil(width / 4) * 4;
const pixelDataSize = rowStride * height;
const paletteSize = 256 * 4;
const headerSize = 14 + 40 + paletteSize;
const fileSize = headerSize + pixelDataSize;
const buffer = Buffer.alloc(fileSize, 0);

buffer.write('BM', 0, 'ascii');
buffer.writeUInt32LE(fileSize, 2);
buffer.writeUInt32LE(headerSize, 10);
buffer.writeUInt32LE(40, 14);
buffer.writeInt32LE(width, 18);
buffer.writeInt32LE(height, 22);
buffer.writeUInt16LE(1, 26);
buffer.writeUInt16LE(8, 28);
buffer.writeUInt32LE(0, 30);
buffer.writeUInt32LE(pixelDataSize, 34);
buffer.writeInt32LE(2835, 38);
buffer.writeInt32LE(2835, 42);
buffer.writeUInt32LE(256, 46);
buffer.writeUInt32LE(0, 50);

const paletteOffset = 14 + 40;
// index 0: black, index 255: white
buffer[paletteOffset + 255 * 4 + 0] = 255;
buffer[paletteOffset + 255 * 4 + 1] = 255;
buffer[paletteOffset + 255 * 4 + 2] = 255;
buffer[paletteOffset + 255 * 4 + 3] = 0;

const pixelOffset = headerSize;
function setPixel(x, y, value) {
    const bmpY = height - 1 - y;
    buffer[pixelOffset + bmpY * rowStride + x] = value;
}

for (let index = 0; index < glyphOrder.length; index++) {
    const codePoint = glyphOrder[index];
    const glyph = font.glyphs[String(codePoint)];
    const gridX = index % columns;
    const gridY = Math.floor(index / columns);
    const baseX = gridX * cellWidth + scale;
    const baseY = gridY * cellHeight + scale;

    for (let row = 0; row < glyph.length; row++) {
        for (let col = 0; col < glyph[row].length; col++) {
            if (glyph[row][col] !== '1') continue;
            for (let sy = 0; sy < scale; sy++) {
                for (let sx = 0; sx < scale; sx++) {
                    setPixel(baseX + col * scale + sx, baseY + row * scale + sy, 255);
                }
            }
        }
    }
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, buffer);
