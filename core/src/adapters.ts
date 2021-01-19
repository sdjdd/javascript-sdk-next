import { Adapters } from '@leancloud/adapter-types';
import { event } from './event';

export type SDKAdapters = Partial<Adapters>;

export const adapters: SDKAdapters = {};

export function setAdapters(newAdapters: SDKAdapters): void {
  Object.assign(adapters, newAdapters);
  event.emit('adapters:set', newAdapters, adapters);
}

export function getAdapter<T extends keyof SDKAdapters>(name: T): SDKAdapters[T] | undefined {
  return adapters[name];
}

export function mustGetAdapter<T extends keyof SDKAdapters>(name: T): SDKAdapters[T] | never {
  if (name in adapters) {
    return adapters[name];
  }
  throw new Error(`未设置 adapter ${name}`);
}
