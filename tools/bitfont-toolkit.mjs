import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseBitmapFontBmf } from '../src/js/bitmap-font-bmf.mjs';

export const SOURCE_ROOT = 'fonts/src';
export const DIST_ROOT = 'dist';

export async function readBmfFont(inputPath) {
    const text = await fs.readFile(inputPath, 'utf8');
    return parseBitmapFontBmf(text, inputPath);
}

export async function writeJsonFile(outputPath, value) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function sanitizeIdentifier(value) {
    return String(value).replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
}

export function packGlyphRows(rows, width) {
    const rowStride = Math.ceil(width / 8);
    const bytes = [];
    for (const row of rows) {
        for (let byteIndex = 0; byteIndex < rowStride; byteIndex++) {
            let value = 0;
            for (let bit = 0; bit < 8; bit++) {
                const col = byteIndex * 8 + bit;
                if (col < width && row[col] === '1') {
                    value |= 1 << (7 - bit);
                }
            }
            bytes.push(value);
        }
    }
    return bytes;
}

export function align(value, alignment) {
    return Math.ceil(value / alignment) * alignment;
}

export async function listBmfSources(rootDir = SOURCE_ROOT) {
    const out = [];

    async function walk(dir) {
        let entries;
        try {
            entries = await fs.readdir(dir, { withFileTypes: true });
        } catch (error) {
            if (error.code === 'ENOENT') return;
            throw error;
        }

        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full);
            } else if (entry.isFile() && entry.name.endsWith('.bmf')) {
                out.push(full);
            }
        }
    }

    await walk(rootDir);
    return out.sort((a, b) => a.localeCompare(b));
}

export function sourceRelativePath(sourcePath) {
    return path.relative(SOURCE_ROOT, sourcePath);
}

export function scriptNameFor(sourcePath) {
    const relative = sourceRelativePath(sourcePath);
    const first = relative.split(path.sep)[0];
    return first && first !== '..' ? first : 'unknown';
}

export function artifactPathFor(sourcePath, kind, extension) {
    const relative = sourceRelativePath(sourcePath);
    const parsed = path.parse(relative);
    return path.join(DIST_ROOT, kind, parsed.dir, `${parsed.name}.${extension}`);
}

export async function removeGeneratedArtifacts(distRoot = DIST_ROOT) {
    await fs.rm(distRoot, { recursive: true, force: true });
    await fs.mkdir(path.join(distRoot, 'json'), { recursive: true });
    await fs.mkdir(path.join(distRoot, 'include'), { recursive: true });
    await fs.mkdir(path.join(distRoot, 'binary'), { recursive: true });
    await fs.mkdir(path.join(distRoot, 'bitmap'), { recursive: true });
}
