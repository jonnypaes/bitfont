#!/usr/bin/env node
import { readBmfFont, writeJsonFile } from './bitfont-toolkit.mjs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
    console.error('Usage: node tools/convert-bmf-to-json.mjs <input.bmf> <output.json>');
    process.exit(1);
}

const font = await readBmfFont(inputPath);
await writeJsonFile(outputPath, {
    ...font,
    glyphAnchors: font.glyphNames
});
