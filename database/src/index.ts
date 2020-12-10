import { Database } from './database';

//@ts-ignore
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

export const components = {
  Database,
};

export type { Database };
