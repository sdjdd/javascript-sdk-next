import type { App } from '../app';
import { ACL, ACLPrivilege } from './acl';
import { Class } from './class';
import { encodeObjectData, EncodeOptions, LCDecode, LCEncode, LCObject } from './lcobject';
import * as op from './operation';
import { Query, QueryDecoder } from './query';
import * as cmd from './query/command';

export class Database {
  readonly cmd = cmd;
  readonly op = op;

  constructor(public readonly app: App) {}

  class(name: string): Class {
    return new Class(this.app, name);
  }

  ACL(data?: Record<string, ACLPrivilege>): ACL {
    if (data) {
      return ACL.fromJSON(data);
    }
    return new ACL();
  }

  createQuery(className: string): Query<LCObject>;
  createQuery<T>(className: string, decoder: QueryDecoder<T>): Query<T>;
  createQuery<T>(className: string, decoder?: QueryDecoder<T>): Query<LCObject> | Query<T> {
    if (decoder) {
      return new Query<T>(this.app, className, decoder);
    }
    return new Query<LCObject>(this.app, className, LCObject.fromJSON);
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
