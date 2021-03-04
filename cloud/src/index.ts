import type { Runtime } from '../../core';
import { Cloud } from './cloud';

declare module '../../core' {
  interface App {
    cloud(): Cloud;
  }
}

export * from './cloud';
export const cloudModule = {
  name: 'cloud',
  components: { Cloud },
  onLoad: ({ modules }: Runtime) => {
    const { App } = modules.core.components;
    App.prototype.cloud = function () {
      return new Cloud(this);
    };
  },
};
