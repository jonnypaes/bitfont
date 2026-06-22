import { parseBitmapFontBmf } from './bitmap-font-bmf.mjs';
import { parseBitmapFontBinary } from './bitmap-font-binary.mjs';

export const DEFAULT_PAGE = window.location.protocol + '//' + window.location.hostname + window.location.pathname;

function startsWithAscii(bytes, text) {
    if (bytes.length < text.length) return false;
    for (let index = 0; index < text.length; index++) {
        if (bytes[index] !== text.charCodeAt(index)) return false;
    }
    return true;
}

export async function loadBitmapFont(path) {
    const url = new URL(path, window.location.href);
    const response = await fetch(url.href, { cache: 'no-cache' });

    if (!response.ok) {
        throw new Error(`Failed to load bitmap font: ${url.href}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (startsWithAscii(bytes, 'BMFB')) {
        return parseBitmapFontBinary(bytes.buffer, url.href);
    }

    const text = new TextDecoder('utf-8').decode(bytes);
    const trimmed = text.trimStart();

    if (trimmed.startsWith('{')) {
        return JSON.parse(text);
    }

    return parseBitmapFontBmf(text, url.href);
}

export function getBitmapGlyph(font, codePoint) {
    return font.glyphs[String(codePoint)]
        || font.glyphs[String(font.fallback || 63)]
        || font.blank;
}
