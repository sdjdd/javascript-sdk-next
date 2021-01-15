import isDate from 'lodash/isDate';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';

import type { App, AuthOptions } from '../app';
import type { Condition } from './query/constraint';
import { ACL } from './acl';

// TODO: 加上 className
const RESERVED_KEYS = ['objectId', 'createdAt', 'updatedAt'];

export function omitReservedKeys(data: Record<string, any>): Record<string, any> {
  return omit(data, RESERVED_KEYS);
}

export interface GetObjectOptions extends AuthOptions {
  keys?: string[];
  include?: string[];
  returnACL?: boolean;
}

export interface UpdateObjectOptions extends AuthOptions {
  fetchUpdatedData?: boolean;
  query?: {
    condition: Condition;
  };
}

export interface EncodeOptions {
  pointer?: boolean;
}

export type LCObjectData = Record<string, any>;

export class LCObject {
  data: LCObjectData = {};

  private _rawData: Record<string, any> = {};

  get createdAt(): Date {
    return this.data.createdAt;
  }
  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  constructor(
    public readonly app: App,
    public readonly className: string,
    public readonly id: string
  ) {}

  static fromJSON(app: App, data: any, className: string = data.className): LCObject {
    const objectId: string = data.objectId;
    if (!className || !objectId) {
      throw new Error(
        'Cannot create LCObject from json: the className or objectId must be provided'
      );
    }
    const object = new LCObject(app, className, objectId);
    object._rawData = data;
    object.data = LCDecode(app, omit(data, ['__type', 'className']));

    if (data.ACL) {
      object.data.ACL = ACL.fromJSON(data.ACL);
    }
    if (data.createdAt) {
      object.data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt) {
      object.data.updatedAt = new Date(data.updatedAt);
    }

    return object;
  }

  protected _LC_encode(options?: EncodeOptions): Record<string, any> {
    if (options?.pointer) {
      return {
        __type: 'Pointer',
        className: this.className,
        objectId: this.id,
      };
    }
    return {
      ...this._rawData,
      __type: 'Object',
      className: this.className,
      objectId: this.id,
    };
  }

  protected _LC_getData(): LCObjectData {
    return getLCObjectData(this.data);
  }

  toJSON(): LCObjectData {
    return this._LC_getData();
  }

  async get(options?: GetObjectOptions): Promise<LCObject> {
    const rawData = await this.app.request(
      {
        method: 'GET',
        path: `/1.1/classes/${this.className}/${this.id}`,
        query: {
          keys: options?.keys?.join(','),
          include: options?.include?.join(','),
          returnACL: options?.returnACL,
        },
      },
      options
    );
    if (isEmpty(rawData)) {
      throw new Error(`不存在 objectId 为 ${this.id} 的对象`);
    }
    return LCObject.fromJSON(this.app, rawData, this.className);
  }

  async update(data: Record<string, any>, options?: UpdateObjectOptions): Promise<LCObject> {
    const rawData = await this.app.request(
      {
        method: 'PUT',
        path: `/1.1/classes/${this.className}/${this.id}`,
        query: {
          fetchWhenSave: options?.fetchUpdatedData,
          where: options?.query?.condition,
        },
        body: encodeObjectData(data),
      },
      options
    );
    return LCObject.fromJSON(this.app, rawData, this.className);
  }

  delete(options?: AuthOptions): Promise<void> {
    return this.app.request(
      {
        method: 'DELETE',
        path: `/1.1/classes/${this.className}/${this.id}`,
      },
      options
    );
  }
}

// @ts-ignore
export interface INTERNAL_LCObject extends LCObject {
  _rawData: Record<string, any>;
  _LC_getData(): LCObjectData;
  _LC_encode(options?: EncodeOptions): Record<string, any>;
}

function getLCObjectData(data: any): any {
  if (data) {
    if (typeof data._LC_getData === 'function') {
      return data._LC_getData();
    }
    if (Array.isArray(data)) {
      return data.map((value) => getLCObjectData(value));
    }
    if (isPlainObject(data)) {
      return mapValues(data, (value) => getLCObjectData(value));
    }
  }
  return data;
}

export interface Encodeable {
  _LC_encode: (...args: any[]) => any;
}

export function isEncodeable(value: any): value is Encodeable {
  return value && typeof value._LC_encode === 'function';
}

export function LCEncode(data: any, options?: EncodeOptions): any {
  if (!data) {
    return data;
  }

  if (isEncodeable(data)) {
    return data._LC_encode(options);
  }

  if (isDate(data)) {
    return { __type: 'Date', iso: data.toISOString() };
  }

  if (Array.isArray(data)) {
    return data.map((value) => LCEncode(value, options));
  }

  if (isPlainObject(data)) {
    return mapValues(data, (value) => LCEncode(value, options));
  }

  return data;
}

export function encodeObjectData(data: Record<string, any>): Record<string, any> {
  return LCEncode(omitReservedKeys(data), { pointer: true });
}

export function LCDecode(app: App, data: any): any {
  if (!data) {
    return data;
  }
  if (isPlainObject(data)) {
    switch (data.__type) {
      case 'Pointer':
      case 'Object':
        return LCObject.fromJSON(app, data);
      case 'File':
        return LCObject.fromJSON(app, data, '_File');
      case 'Date':
        return new Date(data.iso);
      case 'GeoPoint':
        return { longitude: data.longitude, latitude: data.latitude };
      default:
        return mapValues(data, (value) => LCDecode(app, value));
    }
  }
  if (Array.isArray(data)) {
    return data.map((value) => LCDecode(app, value));
  }
  return data;
}
