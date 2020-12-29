import { use } from './runtime';
import { App, AppConfig } from './app';
import { Query } from './database';

use({
  name: 'core',
  components: {
    App,
    Query,
  },
});

export * from './database';
export { App, AppConfig, AuthOptions, APIError } from './app';
export { HTTPRequest, HTTPResponse } from './http';
export { getModules, setAdapters } from './runtime';
export * from './version';

export { use };
export function init(config: AppConfig): App {
  return new App(config);
}
