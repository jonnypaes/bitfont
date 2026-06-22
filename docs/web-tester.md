# Web tester

The web tester can preview project fonts from `dist/manifest.json` and export the current font context directly in the browser.

## Standard flow

1. Select a font.
2. Select the load format used for previewing: BMFB, JSON, or BMF.
3. Draw text or render the 0..255 atlas.
4. Select an export format.
5. Click **Download**.

## Export formats

- JSON
- BMF source
- BMFB binary
- BMP atlas
- C header

## Custom font mode

Open the tester with:

```txt
?custom=true
```

Upload a BMF, BMFB, or JSON font. After the upload, the current preview and download context switches to that uploaded font.
