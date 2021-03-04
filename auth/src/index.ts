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

export { Auth };
export * from './user';
export const authModule = {
  name: 'auth',
  components: { Auth, User, Role },
  onLoad: (runtime: Runtime) => {
    setSDKRuntime(runtime);
    const { App } = runtime.modules.core.components;
    App.prototype.auth = function () {
      return new Auth(this);
    };
    setHooks(App);
  },
};
