import { loadBitmapFont, loadBitmapFontFile } from './bitmap-font-loader.mjs';
import { artifactPathFor, createFileEntry } from './manifest.mjs';

export function normalizeManifestEntries(manifest) {
    return (manifest.fonts || []).map((entry) => ({
        ...entry,
        sourceRoot: manifest.sourceRoot || 'fonts/src'
    }));
}

export function findFontEntry(state, id) {
    return state.entries.find((entry) => entry.id === id) || null;
}

export function getAvailableFormats(entry) {
    if (!entry) return [];
    if (entry.localFile) return ['file'];

    const formats = [];
    if (entry.artifacts?.binary) formats.push('binary');
    if (entry.artifacts?.json) formats.push('json');
    if (entry.source) formats.push('source');
    return formats;
}

export async function loadFontForEntry(state, entry, format) {
    if (entry.localFile) {
        return { font: entry.font, path: entry.source, format: 'file' };
    }

    const path = artifactPathFor(entry, format);
    const cacheKey = `${format}:${path}`;

    if (!state.loadedFonts.has(cacheKey)) {
        state.loadedFonts.set(cacheKey, await loadBitmapFont(path));
    }

    return { font: state.loadedFonts.get(cacheKey), path, format };
}

export async function addFontFromFile(state, file) {
    const font = await loadBitmapFontFile(file);
    const entry = createFileEntry(font, file.name);
    entry.id = uniqueEntryId(state, entry.id);
    state.entries.push(entry);
    state.selectedFontId = entry.id;
    state.selectedFormat = 'file';
    return entry;
}

function uniqueEntryId(state, id) {
    let candidate = id;
    let suffix = 2;
    while (state.entries.some((entry) => entry.id === candidate)) {
        candidate = `${id}_${suffix}`;
        suffix += 1;
    }
    return candidate;
}
