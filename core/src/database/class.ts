import type { AuthOptions } from '../app';

import { encodeObjectData, LCObjectReference } from './lcobject';
import { Query } from './query';

export interface AddObjectOptions extends AuthOptions {
  fetchData?: boolean;
}

export class Class<T> extends Query<T> {
  object(id: string): LCObjectReference<T> {
    return new LCObjectReference(this.app, this.className, id, this._decoder);
  }

  async add(data: Record<string, any>, options?: AddObjectOptions): Promise<T> {
    const rawData = await this.app.request(
      {
        method: 'POST',
        path: `/1.1/classes/${this.className}`,
        query: {
          fetchWhenSave: options?.fetchData,
        },
        body: encodeObjectData(data),
      },
      options
    );
    return this._decoder(this.app, rawData, this.className);
  }
}
