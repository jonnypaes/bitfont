export async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading ${url}`);
    }
    return response.json();
}

export function artifactPathFor(entry, format) {
    if (format === 'source') {
        return `${entry.sourceRoot || 'fonts/src'}/${entry.source}`;
    }
    return entry.artifacts[format];
}

export function createFileEntry(font, pathLabel = 'local-file') {
    return {
        id: font.id || `local_file_${Date.now()}`,
        label: font.label || pathLabel,
        script: font.script || 'local',
        encoding: font.encoding || 'local',
        width: font.width,
        height: font.height,
        advance: font.advance,
        baseline: font.baseline,
        glyphCount: Object.keys(font.glyphs || {}).length,
        source: pathLabel,
        sourceRoot: '',
        artifacts: {},
        localFile: true,
        font
    };
}
