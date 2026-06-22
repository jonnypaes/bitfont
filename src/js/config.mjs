export const MANIFEST_URL = new URL('dist/manifest.json', window.location.href).href;
export const REPOSITORY_URL = 'https://github.com/jonnypaes/bitfont';
export const DEFAULT_SAMPLE_TEXT = 'déjà vu';

export function isCustomModeEnabled() {
    const params = new URLSearchParams(window.location.search);
    return params.get('custom') === 'true';
}
