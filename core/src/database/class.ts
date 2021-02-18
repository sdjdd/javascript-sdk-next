import type { AuthOptions } from '../app';

import { assertCanIgnoreHooks, encodeObjectData, HookName, LCObjectReference } from './lcobject';
import { Query } from './query';

export interface AddObjectOptions extends AuthOptions {
  fetchData?: boolean;
  ignoreHooks?: HookName[];
}

export class Class<T> extends Query<T> {
  object(id: string): LCObjectReference<T> {
    return new LCObjectReference(this.app, this.className, id, this._decoder);
  }

  async add(data: Record<string, any>, options?: AddObjectOptions): Promise<T> {
    const body = encodeObjectData(data);
    if (options?.ignoreHooks?.length) {
      assertCanIgnoreHooks(this.app, options);
      body.__ignore_hooks = options.ignoreHooks;
    }

    const rawData = await this.app.request(
      {
        method: 'POST',
        path: `/1.1/classes/${this.className}`,
        query: {
          fetchWhenSave: options?.fetchData,
        },
        body,
      },
      options
    );
    return this._decoder(this.app, rawData, this.className);
  }
}
