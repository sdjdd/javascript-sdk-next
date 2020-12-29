import { Storage } from './storage';
import { providers } from './provider';

declare module '../../core' {
  interface App {
    storage(): Storage;
  }
}

export const name = 'storage';

export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.storage = function () {
    return new Storage(this);
  };
}

export const components = {
  providers,
  Storage,
};

export * from './storage';
export * from './provider';
