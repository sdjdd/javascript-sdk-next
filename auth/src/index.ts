import type { Runtime } from '../../core';
import { Auth, setHooks } from './auth';
import { User } from './user';
import { Role } from './role';
import { setSDKRuntime } from './runtime';

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

export function onLoad(runtime: Runtime): void {
  setSDKRuntime(runtime);
  const { App } = runtime.modules.core.components;
  App.prototype.auth = function () {
    return new Auth(this);
  };
  setHooks(App);
}

export { Auth };
export * from './user';
