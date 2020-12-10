import { LeanCloud } from './leancloud';
import { App } from './app';

const LC = new LeanCloud();

LC.modules.core = {
  name: 'core',
  components: {
    LeanCloud,
    App,
  },
};

export default LC;
export { LC };
export type { App };
export type { AuthOptions } from './app';
