import { DEFAULT_SAMPLE_TEXT } from './config.mjs';

export function createInitialState() {
    return {
        manifest: null,
        entries: [],
        loadedFonts: new Map(),
        selectedFontId: null,
        selectedFormat: 'binary',
        selectedExportFormat: 'json',
        color: '#ffffff',
        labelColor: '#a0a0a0',
        mutedCellColor: 'rgba(128, 128, 128, 0.50)',
        mode: 'text',
        atlasStart: 0,
        atlasEnd: 255,
        sampleText: DEFAULT_SAMPLE_TEXT,
        customMode: false,
        bitmapPreviewUrl: null
    };
}
