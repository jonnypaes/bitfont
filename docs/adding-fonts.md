# Adding fonts

The build scans every `.bmf` file under `fonts/src`.

A source path may contain any number of grouping directories:

```text
fonts/src/<script>/<family>/<font-name>.bmf
fonts/src/<script>/<family>/<size>/<font-name>.bmf
```

Examples:

```text
fonts/src/ascii/terminal/font_terminal_ascii_5x7.bmf
fonts/src/latin/terminal/font_terminal_latin1_8x12.bmf
fonts/src/latin/terminal/font_terminal_latin1_9x12.bmf
fonts/src/latin/serif/font_serif_latin1_10x13.bmf
```

Generated artifacts preserve the source-relative path:

```text
fonts/src/latin/terminal/font_terminal_latin1_9x12.bmf
```

becomes:

```text
dist/json/latin/terminal/font_terminal_latin1_9x12.json
dist/include/latin/terminal/font_terminal_latin1_9x12.h
dist/binary/latin/terminal/font_terminal_latin1_9x12.bin
dist/bitmap/latin/terminal/font_terminal_latin1_9x12.bmp
```

No central font list is required. The generated `dist/manifest.json` is the registry.
