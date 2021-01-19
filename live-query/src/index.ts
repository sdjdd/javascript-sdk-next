import { setAdapters, debug } from 'leancloud-realtime/core';

import type { Auth } from '../../auth';
import { KEY_SUBSCRIPTION_ID } from '../../common/const';
import type { AuthOptions, Module, Runtime } from '../../core';
import { Subscription } from './live-query';

declare module '../../core' {
  interface App {
    pause(): void;
    resume(): void;
  }

  interface Query<T> {
    subscribe(options?: AuthOptions): Promise<Subscription<T>>;
  }
}

function setAuthHooks(authClass: typeof Auth): void {
  authClass.afterLogin(function () {
    return this.app.localStorage.removeAsync(KEY_SUBSCRIPTION_ID);
  });
  authClass.beforeLogOut(function () {
    return this.app.localStorage.removeAsync(KEY_SUBSCRIPTION_ID);
  });
}

export const name = 'live-query';

export function onLoad(runtime: Runtime): void {
  const { adapters, event, modules } = runtime;
  setAdapters(adapters);
  event.on('adapters:set', setAdapters);

  const { App, Query } = modules.core.components;
  App.prototype.pause = function () {
    this.payload.realtime?.pause();
  };
  App.prototype.resume = function () {
    this.payload.realtime?.resume();
  };
  Query.prototype.subscribe = function (options) {
    return new Subscription(this, options).subscribe();
  };

  if (modules.auth) {
    setAuthHooks(modules.auth.components.Auth);
  } else {
    const listener = (module: Module) => {
      if (module.name === 'auth') {
        event.off('module:load', listener);
        setAuthHooks(module.components.Auth);
      }
    };
    event.on('module:load', listener);
  }
}

export const components = {
  debug,
};
