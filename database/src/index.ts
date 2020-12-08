// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare module '../../core' {
  interface App {
    database(): void;
  }
}

export const name = 'database';

export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.database = function () {
    console.log('app:', this);
  };
}

export default { name, onLoad };
