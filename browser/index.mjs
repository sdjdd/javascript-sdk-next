import * as LC from '../core';
import * as adapters from '@leancloud/platform-adapters-browser';
import { authModule } from '../auth';
import { cloudModule } from '../cloud';
import { liveQueryModule } from '../live-query';
import { searchModule } from '../search';
import { storageModule } from '../storage';

LC.setAdapters(adapters);
LC.use(authModule);
LC.use(cloudModule);
LC.use(liveQueryModule);
LC.use(searchModule);
LC.use(storageModule);

export * from '../core';
