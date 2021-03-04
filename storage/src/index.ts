import type { Runtime } from '../../core';
import { Storage } from './storage';
import { providers } from './provider';
import { LCFile } from './file';
import { setSDKRuntime } from './runtime';

declare module '../../core' {
  interface App {
    storage(): Storage;
  }
}

export * from './storage';
export * from './provider';
export const storageModule = {
  name: 'storage',
  components: { providers, Storage, LCFile },
  onLoad: (runtime: Runtime) => {
    setSDKRuntime(runtime);
    const { App } = runtime.modules.core.components;
    App.prototype.storage = function () {
      return new Storage(this);
    };
  },
};
