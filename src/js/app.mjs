import { createInitialState } from './app-state.mjs';
import { DEFAULT_PAGE } from './bitmap-font-loader.mjs';
import { isCustomModeEnabled, MANIFEST_URL, REPOSITORY_URL } from './config.mjs';
import { drawAtlasToCanvas, drawTextToCanvas } from './canvas-renderer.mjs';
import { downloadBlob, payloadToBlob } from './downloads.mjs';
import { clearWarning, getRequiredElement, showWarning } from './dom.mjs';
import { exportPayload } from './font-exporter.mjs';
import { addFontFromFile, findFontEntry, loadFontForEntry, normalizeManifestEntries } from './font-registry.mjs';
import { fetchJson } from './manifest.mjs';
import {
    rebuildExportSelect,
    rebuildFontSelect,
    rebuildFormatSelect,
    setCustomPanelVisible,
    updateGeneratedBitmapPreview,
    updateMeta
} from './ui.mjs';

const state = createInitialState();

const elements = {
    warning: getRequiredElement('warning'),
    textInput: getRequiredElement('textInput'),
    fontSelect: getRequiredElement('fontSelect'),
    formatSelect: getRequiredElement('formatSelect'),
    exportSelect: getRequiredElement('exportSelect'),
    customPanel: getRequiredElement('customPanel'),
    fontFiles: getRequiredElement('fontFiles'),
    drawButton: getRequiredElement('drawButton'),
    atlasButton: getRequiredElement('atlasButton'),
    clearButton: getRequiredElement('clearButton'),
    downloadButton: getRequiredElement('downloadButton'),
    canvas: getRequiredElement('fontCanvas'),
    bitmapAtlas: getRequiredElement('bitmapAtlas'),
    meta: getRequiredElement('meta'),
    repoLink: getRequiredElement('repoLink'),
    customModeLink: getRequiredElement('customModeLink')
};

function selectedEntry() {
    return findFontEntry(state, state.selectedFontId || elements.fontSelect.value);
}

async function selectedFont() {
    const entry = selectedEntry();
    if (!entry) {
        throw new Error('No font selected.');
    }

    return {
        entry,
        ...(await loadFontForEntry(state, entry, state.selectedFormat || elements.formatSelect.value))
    };
}

function syncControls() {
    rebuildFontSelect(elements.fontSelect, state.entries, state.selectedFontId);
    const entry = selectedEntry();
    rebuildFormatSelect(elements.formatSelect, entry, state.selectedFormat);
    rebuildExportSelect(elements.exportSelect, state.selectedExportFormat);
    state.selectedFormat = elements.formatSelect.value;
    state.selectedExportFormat = elements.exportSelect.value;
}

function clearCanvas() {
    const ctx = elements.canvas.getContext('2d');
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    updateMeta(elements.meta, ['Canvas cleared.']);
}

function refreshBitmapPreview(font, entry) {
    if (state.bitmapPreviewUrl) {
        URL.revokeObjectURL(state.bitmapPreviewUrl);
        state.bitmapPreviewUrl = null;
    }

    const payload = exportPayload(font, 'bmp');
    const blob = payloadToBlob(payload);
    state.bitmapPreviewUrl = URL.createObjectURL(blob);
    updateGeneratedBitmapPreview(elements.bitmapAtlas, state.bitmapPreviewUrl, entry.label || font.label || font.id);
}

async function render() {
    clearWarning(elements.warning);
    const { entry, font, path, format } = await selectedFont();
    const result = state.mode === 'text'
        ? drawTextToCanvas({ canvas: elements.canvas, font, text: elements.textInput.value, color: state.color })
        : drawAtlasToCanvas({
            canvas: elements.canvas,
            font,
            start: 0,
            end: 255,
            color: state.color,
            labelColor: state.labelColor,
            mutedCellColor: state.mutedCellColor
        });

    refreshBitmapPreview(font, entry);

    updateMeta(elements.meta, [
        `Page: ${DEFAULT_PAGE}`,
        `Loaded: ${format.toUpperCase()} ${path}`,
        `Font: ${entry.label}`,
        `Font ID: ${entry.id}`,
        `Script: ${entry.script}`,
        `Encoding: ${entry.encoding}`,
        `Cell: ${font.width}x${font.height}`,
        `Advance: ${font.advance}`,
        `Glyphs: ${Object.keys(font.glyphs || {}).length}`,
        state.mode === 'text' ? `Input code points: ${result.codes.join(', ')}` : 'Atlas range: 0..255',
        state.mode === 'text' ? `Fallback count: ${result.fallbackCount}` : `Atlas grid: ${result.cols}x${result.rows}`,
        `Canvas cell size: ${result.cellSize}px`,
        `Download context: ${font.id || entry.id}.${state.selectedExportFormat}`
    ]);
}

function renderSafe() {
    render().catch((error) => showWarning(elements.warning, error.message));
}

async function downloadCurrentFont() {
    clearWarning(elements.warning);
    const { entry, font } = await selectedFont();
    const format = state.selectedExportFormat || elements.exportSelect.value;
    const payload = exportPayload(font, format);
    const blob = payloadToBlob(payload);
    const baseName = String(font.id || entry.id || 'bitmap_font').replace(/[^a-zA-Z0-9_.-]/g, '_');
    downloadBlob(blob, `${baseName}.${payload.extension}`);
}

async function loadLocalFiles() {
    for (const file of elements.fontFiles.files) {
        await addFontFromFile(state, file);
    }
    syncControls();
    await render();
}

async function initializeFromManifest() {
    state.manifest = await fetchJson(MANIFEST_URL);
    state.entries = normalizeManifestEntries(state.manifest);
    state.selectedFontId = state.manifest.defaultFont || state.entries[0]?.id || null;
    syncControls();
    await render();
}

async function initialize() {
    state.customMode = isCustomModeEnabled();
    elements.repoLink.href = REPOSITORY_URL;
    elements.customModeLink.href = '?custom=true';
    elements.textInput.value = state.sampleText;
    setCustomPanelVisible(elements.customPanel, state.customMode);

    try {
        await initializeFromManifest();
    } catch (error) {
        const customMessage = 'Automatic font loading failed. Open Custom font mode to upload a local BMF, BMFB, or JSON font.';
        showWarning(elements.warning, `${customMessage} ${error.message}`);
    }

    new ResizeObserver(() => renderSafe()).observe(elements.canvas);
}

elements.fontSelect.addEventListener('change', () => {
    state.selectedFontId = elements.fontSelect.value;
    syncControls();
    renderSafe();
});

elements.formatSelect.addEventListener('change', () => {
    state.selectedFormat = elements.formatSelect.value;
    renderSafe();
});

elements.exportSelect.addEventListener('change', () => {
    state.selectedExportFormat = elements.exportSelect.value;
    renderSafe();
});

elements.drawButton.addEventListener('click', () => {
    state.mode = 'text';
    renderSafe();
});

elements.atlasButton.addEventListener('click', () => {
    state.mode = 'atlas';
    renderSafe();
});

elements.clearButton.addEventListener('click', clearCanvas);
elements.downloadButton.addEventListener('click', () => {
    downloadCurrentFont().catch((error) => showWarning(elements.warning, error.message));
});

elements.fontFiles.addEventListener('change', () => {
    loadLocalFiles().catch((error) => showWarning(elements.warning, error.message));
});

elements.textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        state.mode = 'text';
        renderSafe();
    }
});

initialize().catch((error) => showWarning(elements.warning, `Could not initialize tester: ${error.message}`));
