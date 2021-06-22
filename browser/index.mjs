import { use } from '../core';
import { authModule } from '../auth';
import { cloudModule } from '../cloud';
import { liveQueryModule } from '../live-query';
import { searchModule } from '../search';
import { storageModule } from '../storage';

use(authModule);
use(cloudModule);
use(liveQueryModule);
use(searchModule);
use(storageModule);

export * from '../core';
