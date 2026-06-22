#ifndef BITFONT_BINARY_H
#define BITFONT_BINARY_H

#include <stdint.h>

#define BITFONT_BINARY_MAGIC 0x42464D42u /* BMFB, little-endian */
#define BITFONT_BINARY_HEADER_SIZE 128u
#define BITFONT_BINARY_GLYPH_RECORD_SIZE 16u

typedef struct BitFontBinaryHeader {
    char magic[4];
    uint16_t version_major;
    uint16_t version_minor;
    uint16_t header_size;
    uint16_t alignment;
    uint32_t file_size;
    uint32_t flags;
    uint32_t encoding_id;
    uint32_t first_code_point;
    uint32_t last_code_point;
    uint32_t glyph_count;
    uint32_t fallback_code_point;
    uint16_t width;
    uint16_t height;
    uint16_t advance;
    uint16_t baseline;
    uint16_t row_stride;
    uint16_t glyph_record_size;
    uint32_t glyph_index_offset;
    uint32_t glyph_index_size;
    uint32_t glyph_data_offset;
    uint32_t glyph_data_size;
    uint32_t string_table_offset;
    uint32_t string_table_size;
    uint32_t name_offset;
    uint32_t label_offset;
    uint32_t encoding_name_offset;
    uint8_t reserved[40];
} BitFontBinaryHeader;

typedef struct BitFontBinaryGlyphRecord {
    uint32_t codepoint;
    uint32_t data_offset;
    uint16_t width;
    uint16_t height;
    uint16_t advance;
    uint16_t flags;
} BitFontBinaryGlyphRecord;

#endif
