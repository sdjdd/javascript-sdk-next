import { Cloud } from './cloud';

declare module '../../core' {
  interface App {
    cloud(): Cloud;
  }
}

export const name = 'cloud';
export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.cloud = function () {
    return new Cloud(this);
  };
}

export * from './cloud';
