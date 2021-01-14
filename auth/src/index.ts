import { Auth, setHooks } from './auth';
import { User } from './user';
import { Role } from './role';

declare module '../../core' {
  interface App {
    auth(): Auth;
  }
}

export const name = 'auth';

export const components = {
  Auth,
  User,
  Role,
};

export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.auth = function () {
    return new Auth(this);
  };
  setHooks(App);
}

export { Auth };
export * from './user';
