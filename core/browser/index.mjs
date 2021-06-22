import * as adapters from '@leancloud/platform-adapters-browser';
import { setAdapters } from '../dist/index.mjs';
setAdapters(adapters);
export * from '../dist/index.mjs';
