import { use } from '../core/dist/index.esm';
import { authModule } from '../auth/dist/index.esm';
import { cloudModule } from '../cloud/dist/index.esm';
import { liveQueryModule } from '../live-query/dist/index.esm';
import { searchModule } from '../search/dist/index.esm';
import { storageModule } from '../storage/dist/index.esm';

use(authModule);
use(cloudModule);
use(liveQueryModule);
use(searchModule);
use(storageModule);

export * from '../core/dist/index.esm';
