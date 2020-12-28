import type { App, AuthOptions } from '../app';

import { encodeObjectData, GetObjectOptions, LCObject } from './lcobject';
import { Query, QueryConstraint } from './query';

export interface AddObjectOptions extends AuthOptions {
  fetchData?: boolean;
}

export class Class {
  constructor(public readonly app: App, public readonly name: string) {}

  object(id: string): LCObject {
    return new LCObject(this.app, this.name, id);
  }

  async add(data: Record<string, any>, options?: AddObjectOptions): Promise<LCObject> {
    const rawData = await this.app.request(
      {
        method: 'POST',
        path: `/1.1/classes/${this.name}`,
        query: {
          fetchWhenSave: options?.fetchData,
        },
        body: encodeObjectData(data),
      },
      options
    );
    return LCObject.fromJSON(this.app, rawData, this.name);
  }

  get(objectId: string, options?: GetObjectOptions): Promise<LCObject>;
  get(cond?: QueryConstraint, options?: AuthOptions): Promise<LCObject[]>;
  get(arg: any, options?: any): any {
    if (typeof arg === 'string') {
      return new LCObject(this.app, this.name, arg).get(options);
    }
    const query = new Query(this.app, this.name, LCObject.fromJSON);
    if (arg) {
      query.where(arg);
    }
    return query.find(options);
  }
}
