import { use } from './runtime';
import { App, AppConfig } from './app';

use({
  name: 'core',
  components: {
    App,
  },
});

export * from './database';
export { setAdapters } from './adapter';
export { App, AppConfig, AuthOptions, APIError } from './app';
export { HTTPRequest, HTTPResponse } from './http';
export { getModules } from './runtime';
export * from './version';

export { use };
export function init(config: AppConfig): App {
  return new App(config);
}
