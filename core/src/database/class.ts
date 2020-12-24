import type { App, AuthOptions } from '../app';

import { encodeObjectData, GetObjectOptions, LCObject } from './lcobject';
import { Query } from './query';

export interface AddObjectOptions extends AuthOptions {
  fetchData?: boolean;
}

export class Class extends Query<LCObject> {
  constructor(app: App, name: string) {
    super(app, name, LCObject.fromJSON);
  }

  object(id: string): LCObject {
    return new LCObject(this.app, this.className, id);
  }

  async add(data: Record<string, any>, options?: AddObjectOptions): Promise<LCObject> {
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

  get(id: string, options?: GetObjectOptions): Promise<LCObject> {
    return new LCObject(this.app, this.className, id).get(options);
  }
}
