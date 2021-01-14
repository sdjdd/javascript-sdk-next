import { Storage } from './storage';
import { providers } from './provider';
import { LCFile } from './file';

declare module '../../core' {
  interface App {
    storage(): Storage;
  }
}

export const name = 'storage';

export const components = {
  providers,
  Storage,
  LCFile,
};

export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.storage = function () {
    return new Storage(this);
  };
}

export * from './storage';
export * from './provider';
