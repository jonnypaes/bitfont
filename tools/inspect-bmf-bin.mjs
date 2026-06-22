#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { parseBitmapFontBinary } from '../src/js/bitmap-font-binary.mjs';

const [inputPath] = process.argv.slice(2);
if (!inputPath) {
    console.error('Usage: node tools/inspect-bmf-bin.mjs <input.bin>');
    process.exit(1);
}

const buffer = await fs.readFile(inputPath);
const font = parseBitmapFontBinary(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), inputPath);
console.log(JSON.stringify({
    id: font.id,
    label: font.label,
    encoding: font.encoding,
    width: font.width,
    height: font.height,
    glyphCount: font.glyphOrder.length,
    range: font.range
}, null, 2));
