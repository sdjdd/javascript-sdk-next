import type { App } from '../app';
import { ACL, ACLPrivilege } from './acl';
import { Class } from './class';
import { encodeObjectData, EncodeOptions, LCDecode, LCEncode, LCObject } from './lcobject';
import * as op from './operation';
import { Pipeline } from './pipeline';
import { QueryDecoder } from './query';
import * as cmd from './query/command';
import { InConstraint } from './query/constraint';

export class Database {
  readonly cmd = {
    ...cmd,
    in: (value: any) => new InConstraint(value),
  };
  readonly op = op;

  constructor(public readonly app: App) {}

  class(name: string): Class<LCObject>;
  class<T>(name: string, decoder: QueryDecoder<T>): Class<T>;
  class<T>(name: string, decoder?: QueryDecoder<T>): Class<LCObject> | Class<T> {
    if (decoder) {
      return new Class(this.app, name, decoder);
    }
    return new Class(this.app, name, LCObject.fromJSON);
  }

  ACL(data?: Record<string, ACLPrivilege>): ACL {
    if (data) {
      return ACL.fromJSON(data);
    }
    return new ACL();
  }

  pipeline(): Pipeline {
    return new Pipeline(this.app);
  }

  encode(data: any, options?: EncodeOptions): any {
    return LCEncode(data, options);
  }

  decode(data: any): any {
    return LCDecode(this.app, data);
  }

  encodeObjectData(data: Record<string, any>): Record<string, any> {
    return encodeObjectData(data);
  }

  decodeObject(data: Record<string, any>, className?: string): LCObject {
    return LCObject.fromJSON(this.app, data, className);
  }
}
