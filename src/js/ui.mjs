import { getAvailableFormats } from './font-registry.mjs';

const FORMAT_LABELS = {
    binary: 'BMFB',
    json: 'JSON',
    source: 'BMF',
    file: 'Uploaded file'
};

export const EXPORT_FORMATS = [
    { value: 'json', label: 'JSON' },
    { value: 'bmf', label: 'BMF source' },
    { value: 'bin', label: 'BMFB binary' },
    { value: 'bmp', label: 'BMP atlas' },
    { value: 'h', label: 'C header' }
];

export function rebuildFontSelect(select, entries, selectedFontId) {
    select.innerHTML = '';

    for (const entry of entries) {
        const option = document.createElement('option');
        option.value = entry.id;
        option.textContent = `${entry.label} (${entry.script}, ${entry.width}x${entry.height})`;
        select.appendChild(option);
    }

    if (selectedFontId) {
        select.value = selectedFontId;
    }
}

export function rebuildFormatSelect(select, entry, selectedFormat) {
    select.innerHTML = '';

    const formats = getAvailableFormats(entry);
    for (const format of formats) {
        const option = document.createElement('option');
        option.value = format;
        option.textContent = FORMAT_LABELS[format] || format;
        select.appendChild(option);
    }

    if (formats.includes(selectedFormat)) {
        select.value = selectedFormat;
    } else if (formats.length > 0) {
        select.value = formats[0];
    }
}

export function rebuildExportSelect(select, selectedFormat = 'json') {
    select.innerHTML = '';

    for (const format of EXPORT_FORMATS) {
        const option = document.createElement('option');
        option.value = format.value;
        option.textContent = format.label;
        select.appendChild(option);
    }

    select.value = selectedFormat;
}

export function updateGeneratedBitmapPreview(image, objectUrl, label) {
    image.src = objectUrl;
    image.alt = `${label} generated BMP byte atlas`;
}

export function updateMeta(element, lines) {
    element.textContent = lines.filter(Boolean).join('\n');
}

export function setCustomPanelVisible(panel, visible) {
    panel.hidden = !visible;
}
