import type { App } from '../app';

import { APIError } from '../errors';
import { ACL, ACLPrivilege } from './acl';
import { Class } from './class';
import {
  EncodeOptions,
  DeleteObjectOptions,
  LCDecode,
  LCEncode,
  LCObject,
  LCObjectDecoder,
  encodeObjectData,
  makeDeleteObjectRequest,
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

  async destroyAll(objects: { className: string; id: string }[], options?: DeleteObjectOptions) {
    const idsByClassName: Record<string, string[]> = {};
    objects.forEach(({ className, id }) => {
      if (className in idsByClassName) {
        idsByClassName[className].push(id);
      } else {
        idsByClassName[className] = [id];
      }
    });

    const { body } = makeDeleteObjectRequest('', '', options);
    const requests = Object.entries(idsByClassName).map(([className, ids]) => ({
      method: 'DELETE',
      path: `/1.1/classes/${className}/${ids.join(',')}`,
      body,
    }));

    const results = (await this.app.request({
      method: 'POST',
      path: '/1.1/batch',
      body: { requests },
    })) as { error?: { code: number; error: string } }[];

    const errorResults = results.filter((r) => r.error);
    if (errorResults.length) {
      const apiErrors = errorResults.map(({ error }) => new APIError(error.code, error.error));
      (apiErrors[0] as any).errors = apiErrors;
      throw apiErrors[0];
    }
  }
}
