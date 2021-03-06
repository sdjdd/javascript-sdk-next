import type { App } from '../app';
import { ACL, ACLPrivilege } from './acl';
import { Class } from './class';
import {
  EncodeOptions,
  LCDecode,
  LCEncode,
  LCObject,
  LCObjectDecoder,
  encodeObjectData,
} from './lcobject';
import * as operation from './operation';
import { Pipeline } from './pipeline';
import { Query, queryCommand } from './query';
import { GeoPoint } from './geo';

export { operation };

export class Database {
  readonly cmd = queryCommand;
  readonly op = operation;

  constructor(public readonly app: App) {}

  query(className: string): Query<LCObject>;
  query<T>(className: string, decoder: LCObjectDecoder<T>): Query<T>;
  query<T>(className: string, decoder?: LCObjectDecoder<T>): Query<LCObject> | Query<T> {
    if (decoder) {
      return new Query(this.app, className, decoder);
    }
    return new Query(this.app, className, LCObject.fromJSON);
  }

  class(name: string): Class<LCObject>;
  class<T>(name: string, decoder: LCObjectDecoder<T>): Class<T>;
  class<T>(name: string, decoder?: LCObjectDecoder<T>): Class<LCObject> | Class<T> {
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

  geoPoint(latitude: number, longitude: number): GeoPoint {
    return new GeoPoint(latitude, longitude);
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
