import { parseBitmapFontBmf } from './bitmap-font-bmf.mjs';
import { parseBitmapFontBinary } from './bitmap-font-binary.mjs';

const CURRENT_LOCATION = typeof window !== 'undefined' ? window.location : null;

export const DEFAULT_PAGE = CURRENT_LOCATION
    ? `${CURRENT_LOCATION.protocol}//${CURRENT_LOCATION.hostname}${CURRENT_LOCATION.pathname}`
    : '';

function baseHref() {
    return CURRENT_LOCATION ? CURRENT_LOCATION.href : 'file:///';
}

function startsWithAscii(bytes, text) {
    if (bytes.length < text.length) return false;
    for (let index = 0; index < text.length; index += 1) {
        if (bytes[index] !== text.charCodeAt(index)) return false;
    }
    return true;
}

function normalizeFont(font) {
    const glyphNames = font.glyphNames || font.glyphAnchors || {};
    return {
        ...font,
        schema: font.schema || 'bitfont/bitmap-font/v1',
        glyphNames,
        glyphOrder: font.glyphOrder || Object.keys(font.glyphs || {}).map((value) => Number(value)).sort((a, b) => a - b),
        blank: font.blank || Array.from({ length: font.height || 0 }, () => '0'.repeat(font.width || 0))
    };
}

export function parseBitmapFontBytes(bytes, sourceName = 'inline') {
    if (startsWithAscii(bytes, 'BMFB')) {
        return normalizeFont(parseBitmapFontBinary(bytes.buffer, sourceName));
    }

    const text = new TextDecoder('utf-8').decode(bytes);
    const trimmed = text.trimStart();

    if (trimmed.startsWith('{')) {
        return normalizeFont(JSON.parse(text));
    }

    return normalizeFont(parseBitmapFontBmf(text, sourceName));
}

export async function loadBitmapFont(path) {
    const url = new URL(path, baseHref());
    const response = await fetch(url.href, { cache: 'no-cache' });

    if (!response.ok) {
        throw new Error(`Failed to load bitmap font: ${url.href}`);
    }

    return parseBitmapFontBytes(new Uint8Array(await response.arrayBuffer()), url.href);
}

export async function loadBitmapFontFile(file) {
    return parseBitmapFontBytes(new Uint8Array(await file.arrayBuffer()), file.name);
}

export function getBitmapGlyph(font, codePoint) {
    return font.glyphs[String(codePoint)]
        || font.glyphs[String(font.fallback || 63)]
        || font.blank;
}

export function hasFullCoverage(font, start, end) {
    for (let codePoint = start; codePoint <= end; codePoint += 1) {
        if (!font.glyphs[String(codePoint)]) return false;
    }
    return true;
}
