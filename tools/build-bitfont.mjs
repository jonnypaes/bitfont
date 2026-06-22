#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
    artifactPathFor,
    listBmfSources,
    readBmfFont,
    removeGeneratedArtifacts,
    scriptNameFor,
    sourceRelativePath,
    writeJsonFile
} from './bitfont-toolkit.mjs';

function runNode(script, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [script, ...args], { stdio: 'inherit' });
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            reject(new Error(`${script} failed with exit code ${code}`));
        });
        child.on('error', reject);
    });
}

await removeGeneratedArtifacts('dist');

const sources = await listBmfSources('fonts/src');
if (sources.length === 0) {
    throw new Error('No .bmf sources found under fonts/src.');
}

const manifestFonts = [];

for (const source of sources) {
    const font = await readBmfFont(source);
    const jsonPath = artifactPathFor(source, 'json', 'json');
    const headerPath = artifactPathFor(source, 'include', 'h');
    const binaryPath = artifactPathFor(source, 'binary', 'bin');
    const bitmapPath = artifactPathFor(source, 'bitmap', 'bmp');

    await runNode('tools/convert-bmf-to-json.mjs', [source, jsonPath]);
    await runNode('tools/convert-bmf-to-c-header.mjs', [source, headerPath]);
    await runNode('tools/convert-bmf-to-bin.mjs', [source, binaryPath]);
    await runNode('tools/convert-bmf-to-bmp.mjs', [source, bitmapPath]);
    await runNode('tools/inspect-bmf-bin.mjs', [binaryPath]);

    manifestFonts.push({
        id: font.id,
        label: font.label,
        script: font.script || scriptNameFor(source),
        encoding: font.encoding,
        width: font.width,
        height: font.height,
        advance: font.advance,
        baseline: font.baseline,
        glyphCount: font.glyphOrder.length,
        source: sourceRelativePath(source),
        artifacts: {
            json: path.relative('.', jsonPath),
            cHeader: path.relative('.', headerPath),
            binary: path.relative('.', binaryPath),
            bitmap: path.relative('.', bitmapPath)
        }
    });
}

manifestFonts.sort((a, b) => a.id.localeCompare(b.id));
const preferredDefault = manifestFonts.find((font) => font.id === 'font_terminal_latin1_8x12') || manifestFonts[0];
const manifest = {
    schema: 'bitfont/manifest/v1',
    name: 'BitFont',
    description: 'BMF source fonts and generated runtime artifacts.',
    sourceRoot: 'fonts/src',
    distRoot: 'dist',
    defaultFont: preferredDefault.id,
    fonts: manifestFonts
};

await writeJsonFile('dist/manifest.json', manifest);
await writeJsonFile('manifest.json', {
    schema: 'bitfont/project/v1',
    name: 'BitFont',
    tester: 'BMF Bitmap Font Tester',
    manifest: 'dist/manifest.json'
});

await fs.mkdir('build', { recursive: true });
await writeJsonFile('build/manifest.json', manifest);
console.log(`Built ${manifestFonts.length} bitmap font source file(s).`);
