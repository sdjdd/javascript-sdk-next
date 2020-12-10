import { Database } from './database';

export const name = 'database';

export function onLoad(LC): void {
  const { App } = LC.modules.core.components;
  App.prototype.database = function () {
    return new Database(this);
  };
}

export default { name, onLoad };

export type { Database };
