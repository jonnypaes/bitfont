# BMF source format

BMF is a line-oriented text format for bitmap font sources.

```text
BMF 1
NAME font_terminal_ascii_5x7
LABEL Terminal ASCII 5x7
SCRIPT ascii
ENCODING ASCII
WIDTH 5
HEIGHT 7
ADVANCE 6
BASELINE 7
RANGE 0x00 0x7F
FALLBACK 0x3F

GLYPH 0x41 A
01110
10001
10001
11111
10001
10001
10001
END
```

Rules:

- The file starts with `BMF 1`.
- Metadata is written as `KEY value`.
- Glyphs start with `GLYPH <codepoint> <name>` and end with `END`.
- Codepoints may use `0xNN`, decimal integers or `U+NNNN`.
- Bitmap rows contain only `0` and `1`.
- Every glyph must match the declared `WIDTH` and `HEIGHT`.
