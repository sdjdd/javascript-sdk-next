import type { APIRequest, AuthOptions } from '../app';

import {
  assertCanIgnoreHooks,
  encodeObjectData,
  IgnoreHookOptions,
  LCObjectReference,
} from './lcobject';
import { Query } from './query';

export interface AddObjectOptions extends AuthOptions, IgnoreHookOptions {
  fetchData?: boolean;
}

export function makeAddObjectRequest(
  className: string,
  data: Record<string, any>,
  options?: AddObjectOptions
): APIRequest & { method: 'POST' } {
  const body = encodeObjectData(data);
  if (options?.ignoreBeforeHook || options?.ignoreAfterHook) {
    body.__ignore_hooks = [];
    if (options.ignoreBeforeHook) {
      body.__ignore_hooks.push('beforeSave');
    }
    if (options.ignoreAfterHook) {
      body.__ignore_hooks.push('afterSave');
    }
  }
  return {
    method: 'POST',
    path: '/1.1/classes/' + className,
    query: {
      fetchWhenSave: options?.fetchData,
    },
    body,
  };
}

export class Class<T> extends Query<T> {
  object(id: string): LCObjectReference<T> {
    return new LCObjectReference(this.app, this.className, id, this._decoder);
  }

  async add(data: Record<string, any>, options?: AddObjectOptions): Promise<T> {
    if (options?.ignoreBeforeHook || options?.ignoreAfterHook) {
      assertCanIgnoreHooks(this.app, options);
    }
    const rawData = await this.app.request(
      makeAddObjectRequest(this.className, data, options),
      options
    );
    return this._decoder(this.app, rawData, this.className);
  }
}
