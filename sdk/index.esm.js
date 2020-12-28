import { use } from '../core/dist/index.esm';
import * as auth from '../auth/dist/index.esm';
import * as search from '../search/dist/index.esm';
import * as cloud from '../cloud/dist/index.esm';
import * as storage from '../storage/dist/index.esm';
use(auth);
use(search);
use(cloud);
use(storage);

export * from '../core/dist/index.esm';
