import { Storage } from './storage';

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

export * from './storage';
