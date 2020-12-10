import { use } from './runtime';
import { App, AppConfig } from './app';

use({
  name: 'core',
  components: {
    App,
  },
});

export { use };

export { setAdapters } from './adapter';

export function init(config: AppConfig): App {
  return new App(config);
}
