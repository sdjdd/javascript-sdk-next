import { Adapters } from '@leancloud/adapter-types';

const ADAPTERS: Partial<Adapters> = {};

export function setAdapters(adapters: typeof ADAPTERS): void {
  Object.assign(ADAPTERS, adapters);
}

export function getAdapter<T extends keyof Adapters>(name: T): typeof ADAPTERS[T] {
  return ADAPTERS[name];
}

export function mustGetAdapter<T extends keyof Adapters>(name: T): typeof ADAPTERS[T] | never {
  const adapter = getAdapter(name);
  if (!adapter) {
    throw new Error(`The adapter "${name}" is not set`);
  }
  return adapter;
}
