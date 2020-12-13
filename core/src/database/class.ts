import type { AuthOptions } from '../app';

import { LCEncode, LCObject, omitReservedKeys } from './lcobject';
import { LCQuery } from './query';

export interface AddObjectOptions extends AuthOptions {
  fetchData?: boolean;
}

export class LCClass extends LCQuery {
  object(id: string): LCObject {
    return new LCObject(this.app, this.className, id);
  }

  async add(data: Record<string, any>, options?: AddObjectOptions) {
    const rawData = await this.app.request(
      {
        method: 'POST',
        path: `/1.1/classes/${this.className}`,
        query: {
          fetchWhenSave: options?.fetchData,
        },
        body: LCEncode(omitReservedKeys(data)),
      },
      options
    );
    return LCObject.fromJSON(this.app, rawData, this.className);
  }
}
