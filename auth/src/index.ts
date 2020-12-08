import { Auth } from './auth';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
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
}

export default { name, onLoad };
