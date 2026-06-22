# BitFont
```
🟥🟥⬛⬛🟥⬛🟥🟥🟥⬛🟥🟥🟥⬛⬛🟥🟥⬛⬛🟥⬛⬛🟥⬛🟥🟥🟥
🟥⬛🟥⬛🟥⬛⬛🟥⬛⬛🟥⬛⬛⬛🟥⬛⬛🟥⬛🟥🟥⬛🟥⬛⬛🟥⬛
🟥🟥⬛⬛🟥⬛⬛🟥⬛⬛🟥🟥🟥⬛🟥⬛⬛🟥⬛🟥⬛🟥🟥⬛⬛🟥⬛
🟥⬛🟥⬛🟥⬛⬛🟥⬛⬛🟥⬛⬛⬛🟥⬛⬛🟥⬛🟥⬛⬛🟥⬛⬛🟥⬛
🟥🟥⬛⬛🟥⬛⬛🟥⬛⬛🟥⬛⬛⬛⬛🟥🟥⬛⬛🟥⬛⬛🟥⬛⬛🟥⬛
```

> BitFont is a small bitmap font toolkit built around BMF, a simple text source format for bitmap fonts. The project includes a browser tester and exporters for JSON, C headers, aligned BMFB binary files, and 8-bit BMP atlas images.

---

## Repository layout

```txt
fonts/src/              BMF source files
dist/json/              generated JSON runtime files
dist/include/           generated C headers
dist/binary/            generated BMFB binary files
dist/bitmap/            generated 8-bit BMP atlas images
src/js/                 web tester JavaScript
src/css/                web tester styles
tools/                  build and conversion tools
docs/                   format documentation
examples/               usage examples
```

## Build

```bash
npm run build
```

or:

```bash
bash build.sh
```

The build script discovers every `.bmf` file under `fonts/src/**` automatically. New sizes, scripts, or font families do not need to be registered manually.

## Current starter fonts

- `font_terminal_ascii_5x7`
- `font_terminal_latin1_8x12`

## Browser tester and converter

The web tester renders the selected font and can download the current font context as:

- JSON
- BMF source
- BMFB binary
- BMP atlas
- C header

The current context can be a generated project font or an uploaded local font.

## Custom font mode

Open the tester with:

```txt
?custom=true
```

Then upload a BMF, BMFB, or JSON font. The preview and Download button will use the uploaded font.

## Links

[GitHub](https://github.com/jonnypaes/bitfont) | [GitHub Pages](https://jonnypaes.github.io/bitfont/) | [BMF format](docs/bmf-format.md) | [BMFB binary](docs/bmfb-binary-format.md) | [Web tester](docs/web-tester.md)

