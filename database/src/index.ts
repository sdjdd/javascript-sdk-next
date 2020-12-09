import { Database } from './database';

declare module '../../core' {
  interface App {
    database(): Database;
  }
}

export const name = 'database';

export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.database = function () {
    return new Database(this);
  };
}

export type { Database } from './database';

export default { name, onLoad };
