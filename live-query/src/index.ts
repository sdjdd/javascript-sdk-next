import { setAdapters, debug } from 'leancloud-realtime/core';

import { AuthOptions, Runtime } from '../../core';
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
}

export const components = {
  debug,
};
