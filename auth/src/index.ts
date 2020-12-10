import { Auth, setHooks } from './auth';

export const name = 'auth';

export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.auth = function () {
    return new Auth(this);
  };
  setHooks(App);
}

export type { Auth };

export default { name, onLoad };
