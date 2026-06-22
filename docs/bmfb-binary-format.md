# BMFB binary format

BMFB is the generated binary runtime format.

All integer fields are little-endian.

```text
0x00  char[4]   magic = "BMFB"
0x04  uint16    version_major
0x06  uint16    version_minor
0x08  uint16    header_size
0x0A  uint16    alignment
0x0C  uint32    file_size
0x10  uint32    flags
0x14  uint32    encoding_id
0x18  uint32    first_code_point
0x1C  uint32    last_code_point
0x20  uint32    glyph_count
0x24  uint32    fallback_code_point
0x28  uint16    width
0x2A  uint16    height
0x2C  uint16    advance
0x2E  uint16    baseline
0x30  uint16    row_stride
0x32  uint16    glyph_record_size
0x34  uint32    glyph_index_offset
0x38  uint32    glyph_index_size
0x3C  uint32    glyph_data_offset
0x40  uint32    glyph_data_size
0x44  uint32    string_table_offset
0x48  uint32    string_table_size
0x4C  uint32    name_offset
0x50  uint32    label_offset
0x54  uint32    encoding_name_offset
```

Sections are aligned to the alignment value declared in the header. Current files use 16-byte alignment and a 128-byte header.
