#!/usr/bin/env node
import { listBmfSources } from './bitfont-toolkit.mjs';

const sources = await listBmfSources('fonts/src');
for (const source of sources) {
    console.log(source);
}
