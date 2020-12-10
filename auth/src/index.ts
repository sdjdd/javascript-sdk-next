import { Auth, setHooks } from './auth';

//@ts-ignore
declare module '../../core' {
  interface App {
    auth(): Auth;
  }
}

export const name = 'auth';

export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.auth = function () {
    return new Auth(this);
  };
  setHooks(App);
}

export { Auth };
