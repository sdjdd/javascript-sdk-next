import type { AuthOptions } from '../../types/core';

import { LCEncode, LCObject, omitReservedKeys } from './object';
import { LCQuery } from './query';

export class LCClass extends LCQuery {
  object(id: string): LCObject {
    return new LCObject(this.app, this.className, id);
  }

  add(data: Record<string, any>, options?: AuthOptions & { fetch?: boolean }) {
    return this.app.api(
      {
        method: 'POST',
        path: `/1.1/classes/${this.className}`,
        query: {
          fetchWhenSave: options?.fetch,
        },
        body: LCEncode(omitReservedKeys(data)),
      },
      {
        ...options,
        after: (data) => LCObject.fromJSON(this.app, data, this.className),
      }
    );
  }
}
