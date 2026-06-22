import { getBitmapGlyph } from './bitmap-font-loader.mjs';

const TEXT_PADDING = 24;
const ATLAS_PADDING = 14;
const ATLAS_GAP = 2;
const ATLAS_LABEL_HEIGHT = 14;
const ATLAS_LABEL_GAP = 4;
const ATLAS_CELL_INSET = 2;
const MIN_TEXT_CELL_SIZE = 3;
const MAX_TEXT_CELL_SIZE = 24;

const CONTROL_LABELS = new Map([
    [0x00, 'NUL'], [0x01, 'SOH'], [0x02, 'STX'], [0x03, 'ETX'],
    [0x04, 'EOT'], [0x05, 'ENQ'], [0x06, 'ACK'], [0x07, 'BEL'],
    [0x08, 'BS'], [0x09, 'TAB'], [0x0A, 'LF'], [0x0B, 'VT'],
    [0x0C, 'FF'], [0x0D, 'CR'], [0x0E, 'SO'], [0x0F, 'SI'],
    [0x10, 'DLE'], [0x11, 'DC1'], [0x12, 'DC2'], [0x13, 'DC3'],
    [0x14, 'DC4'], [0x15, 'NAK'], [0x16, 'SYN'], [0x17, 'ETB'],
    [0x18, 'CAN'], [0x19, 'EM'], [0x1A, 'SUB'], [0x1B, 'ESC'],
    [0x1C, 'FS'], [0x1D, 'GS'], [0x1E, 'RS'], [0x1F, 'US'],
    [0x20, 'SP'], [0x7F, 'DEL'], [0xA0, 'NB']
]);

export function getCodePoints(text) {
    return Array.from(text).map((char) => char.codePointAt(0));
}

export function resizeCanvasToContainer(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(260, Math.floor(rect.height));
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pixelWidth = Math.floor(width * dpr);
    const pixelHeight = Math.floor(height * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    return { width, height, dpr };
}

function clearCanvas(ctx, size) {
    ctx.clearRect(0, 0, size.width, size.height);
}

function drawGlyph(ctx, glyph, x, y, cellSize, color) {
    ctx.fillStyle = color;
    const pixelSize = Math.max(1, cellSize - 1);

    for (let row = 0; row < glyph.length; row += 1) {
        const bits = glyph[row];
        for (let col = 0; col < bits.length; col += 1) {
            if (bits[col] === '1') {
                ctx.fillRect(x + col * cellSize, y + row * cellSize, pixelSize, pixelSize);
            }
        }
    }
}

function countLines(codes) {
    return 1 + codes.filter((codePoint) => codePoint === 10).length;
}

function lineLengths(codes) {
    const lengths = [0];
    for (const codePoint of codes) {
        if (codePoint === 10) {
            lengths.push(0);
        } else {
            lengths[lengths.length - 1] += 1;
        }
    }
    return lengths;
}

function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
}

function computeTextCellSize(font, codes, width, height) {
    const longestLineLength = Math.max(1, ...lineLengths(codes));
    const lineCount = Math.max(1, countLines(codes));
    const maxWidthCell = Math.floor((width - TEXT_PADDING * 2) / Math.max(1, longestLineLength * font.advance));
    const maxHeightCell = Math.floor((height - TEXT_PADDING * 2) / Math.max(1, lineCount * (font.height + 2)));
    return clamp(Math.min(maxWidthCell, maxHeightCell), MIN_TEXT_CELL_SIZE, MAX_TEXT_CELL_SIZE);
}

export function drawTextToCanvas({ canvas, font, text, color }) {
    canvas.classList.remove('atlas-mode');
    canvas.style.removeProperty('height');

    const ctx = canvas.getContext('2d');
    const size = resizeCanvasToContainer(canvas);
    clearCanvas(ctx, size);

    const codes = getCodePoints(text);
    const cellSize = computeTextCellSize(font, codes, size.width, size.height);
    const advance = font.advance * cellSize;
    const lineHeight = (font.height + 2) * cellSize;
    const maxX = size.width - TEXT_PADDING - advance;
    let x = TEXT_PADDING;
    let y = TEXT_PADDING;
    let fallbackCount = 0;

    for (const codePoint of codes) {
        if (codePoint === 10) {
            x = TEXT_PADDING;
            y += lineHeight;
            continue;
        }

        if (x > maxX) {
            x = TEXT_PADDING;
            y += lineHeight;
        }

        if (!font.glyphs[String(codePoint)]) fallbackCount += 1;
        drawGlyph(ctx, getBitmapGlyph(font, codePoint), x, y, cellSize, color);
        x += advance;
    }

    return { codes, fallbackCount, cellSize, canvasSize: size };
}

function atlasColumnsForWidth(width) {
    if (width >= 1180) return 24;
    if (width >= 900) return 24;
    if (width >= 700) return 20;
    if (width >= 520) return 16;
    return 8;
}

function maxAtlasScaleFor(font, width) {
    if (width < 520) return 2;
    if (font.height >= 12) return 3;
    return 5;
}

function computeAtlasLayout(font, width, start, end) {
    const count = end - start + 1;
    const cols = atlasColumnsForWidth(width);
    const rows = Math.ceil(count / cols);
    const availableWidth = Math.max(1, width - ATLAS_PADDING * 2 - ATLAS_GAP * (cols - 1));
    const cellW = Math.floor(availableWidth / cols);
    const rawScale = Math.floor((cellW - ATLAS_CELL_INSET * 2) / Math.max(1, font.width));
    const cellSize = clamp(rawScale, 1, maxAtlasScaleFor(font, width));
    const glyphH = font.height * cellSize;
    const cellH = glyphH + ATLAS_LABEL_HEIGHT + ATLAS_LABEL_GAP + ATLAS_CELL_INSET * 2;
    const canvasHeight = ATLAS_PADDING * 2 + rows * cellH + (rows - 1) * ATLAS_GAP;
    const usedWidth = cols * cellW + (cols - 1) * ATLAS_GAP;
    const offsetX = Math.max(ATLAS_PADDING, Math.floor((width - usedWidth) / 2));

    return { cols, rows, cellSize, cellW, cellH, canvasHeight, offsetX, offsetY: ATLAS_PADDING };
}

function codeLabel(codePoint) {
    return `0x${codePoint.toString(16).toUpperCase().padStart(2, '0')}`;
}

function markerLabel(font, codePoint) {
    if (CONTROL_LABELS.has(codePoint)) return CONTROL_LABELS.get(codePoint);
    if (codePoint >= 0x21 && codePoint <= 0x7E) return String.fromCodePoint(codePoint);
    if (codePoint >= 0xA1 && codePoint <= 0xFF) return String.fromCodePoint(codePoint);
    const name = font.glyphNames?.[String(codePoint)] || '';
    if (name && !/^U_[0-9A-F]+$/i.test(name)) return name;
    return '';
}

function drawAtlasLabel(ctx, font, codePoint, x, y, cellW) {
    const code = codeLabel(codePoint);
    const marker = markerLabel(font, codePoint);
    const labelY = y;

    ctx.font = '9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(245, 245, 245, 0.64)';
    ctx.fillText(code, x, labelY);

    if (!marker) return;

    const codeWidth = Math.ceil(ctx.measureText(code).width);
    const markerText = marker.length > 3 ? marker.slice(0, 3) : marker;
    const markerWidth = Math.min(cellW - codeWidth - 4, Math.ceil(ctx.measureText(markerText).width) + 6);

    if (markerWidth < 7) return;

    const markerX = x + codeWidth + 3;
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(markerX, labelY, markerWidth, 11);
    ctx.fillStyle = '#000000';
    ctx.fillText(markerText, markerX + 3, labelY + 1);
}

export function drawAtlasToCanvas({ canvas, font, start, end, color, mutedCellColor }) {
    canvas.classList.add('atlas-mode');

    const baseWidth = Math.max(320, Math.floor(canvas.getBoundingClientRect().width));
    const layout = computeAtlasLayout(font, baseWidth, start, end);
    canvas.style.height = `${layout.canvasHeight}px`;

    const ctx = canvas.getContext('2d');
    const size = resizeCanvasToContainer(canvas);
    const actualLayout = computeAtlasLayout(font, size.width, start, end);
    clearCanvas(ctx, size);

    for (let codePoint = start; codePoint <= end; codePoint += 1) {
        const index = codePoint - start;
        const col = index % actualLayout.cols;
        const row = Math.floor(index / actualLayout.cols);
        const x = actualLayout.offsetX + col * (actualLayout.cellW + ATLAS_GAP);
        const y = actualLayout.offsetY + row * (actualLayout.cellH + ATLAS_GAP);
        const glyph = getBitmapGlyph(font, codePoint);
        const glyphW = font.width * actualLayout.cellSize;
        const glyphH = font.height * actualLayout.cellSize;
        const glyphX = x + Math.floor((actualLayout.cellW - glyphW) / 2);
        const glyphY = y + ATLAS_CELL_INSET;
        const labelY = y + glyphH + ATLAS_LABEL_GAP + ATLAS_CELL_INSET;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, actualLayout.cellW, actualLayout.cellH);
        ctx.clip();

        if (codePoint <= 127) {
            ctx.fillStyle = mutedCellColor;
            ctx.fillRect(x, y, actualLayout.cellW, actualLayout.cellH);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.strokeRect(x + 0.5, y + 0.5, actualLayout.cellW - 1, actualLayout.cellH - 1);
        drawGlyph(ctx, glyph, glyphX, glyphY, actualLayout.cellSize, color);
        drawAtlasLabel(ctx, font, codePoint, x + 3, labelY, actualLayout.cellW - 6);
        ctx.restore();
    }

    return {
        start,
        end,
        cellSize: actualLayout.cellSize,
        cols: actualLayout.cols,
        rows: actualLayout.rows,
        canvasSize: size
    };
}
