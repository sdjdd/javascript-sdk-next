import type { App } from '../app';
import { LCClass } from './class';
import { LCDecode, LCEncode, LCObject, omitReservedKeys } from './lcobject';
import { equalCommand, notEqualCommand, orCommand } from './query/command';
import { ExistsConstraint, NotExistsConstraint } from './query/constraint';

export class Database {
  readonly queryCommand = {
    eq: equalCommand,
    ne: notEqualCommand,
    or: orCommand,
    exists: new ExistsConstraint(),
    notExists: new NotExistsConstraint(),
  };

  constructor(public readonly app: App) {}

  class(name: string): LCClass {
    return new LCClass(this.app, name);
  }

  decodeObject(data: Record<string, any>, className?: string): LCObject {
    return LCObject.fromJSON(this.app, data, className);
  }

  decode(data: any): any {
    return LCDecode(this.app, data);
  }

  encodeObjectData(data: Record<string, any>): Record<string, any> {
    return LCEncode(omitReservedKeys(data));
  }
}
