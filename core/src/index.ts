import { use } from './runtime';
import { App, AppConfig } from './app';
import { Database, Query, LCObject } from './database';

use({
  name: 'core',
  components: {
    App,
    Database,
    Query,
    LCObject,
  },
});

export * from './database';
export { setAdapters } from './adapters';
export { App, AppConfig, AuthOptions } from './app';
export { HTTPRequest, HTTPResponse } from './http';
export { Runtime } from './runtime';
export * from './version';

export { use };
export function init(config: AppConfig): App {
  return new App(config);
}
