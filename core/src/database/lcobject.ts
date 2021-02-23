import isDate from 'lodash/isDate';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';

import type { App, AuthOptions } from '../app';
import type { Condition } from './query/constraint';
import { ACL } from './acl';

const RESERVED_KEYS = ['className', 'objectId', 'createdAt', 'updatedAt'];

export function omitReservedKeys(data: Record<string, any>): Record<string, any> {
  return omit(data, RESERVED_KEYS);
}

export const hookNames = [
  'beforeSave',
  'afterSave',
  'beforeUpdate',
  'afterUpdate',
  'beforeDelete',
  'beforeDelete',
] as const;

export type HookName = typeof hookNames[number];

export function assertCanIgnoreHooks(app: App, options?: AuthOptions): void | never {
  if (!app.hookKey) {
    if (!app.masterKey) {
      throw new Error('Cannot ignore hooks when both hookKey and masterKey is not set');
    }
    if (options?.useMasterKey === false || (!options?.useMasterKey && !app.useMasterKey)) {
      throw new Error('Cannot ignore hooks when useMasterKey is false');
    }
  }
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
  ignoreHooks?: HookName[];
}

export interface DeleteObjectOptions extends AuthOptions {
  ignoreHooks?: HookName[];
}

export interface EncodeOptions {
  pointer?: boolean;
}

export type LCObjectDecoder<T = any> = (app: App, data: any, className: string) => T;

export class LCObjectReference<T> {
  constructor(
    public readonly app: App,
    public readonly className: string,
    public readonly id: string,
    protected _decoder: LCObjectDecoder
  ) {}

  async get(options?: GetObjectOptions): Promise<T> {
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
    return this._decoder(this.app, rawData, this.className);
  }

  async update(data: Record<string, any>, options?: UpdateObjectOptions): Promise<T> {
    const body = encodeObjectData(data);
    if (options?.ignoreHooks?.length) {
      assertCanIgnoreHooks(this.app, options);
      body.__ignore_hooks = options.ignoreHooks;
    }

    const rawData = await this.app.request(
      {
        method: 'PUT',
        path: `/1.1/classes/${this.className}/${this.id}`,
        query: {
          fetchWhenSave: options?.fetchUpdatedData,
          where: options?.query?.condition,
        },
        body,
      },
      options
    );
    return this._decoder(this.app, rawData, this.className);
  }

  async delete(options?: DeleteObjectOptions): Promise<void> {
    if (options?.ignoreHooks?.length) {
      assertCanIgnoreHooks(this.app, options);
    }

    await this.app.request(
      {
        method: 'DELETE',
        path: `/1.1/classes/${this.className}/${this.id}`,
        body: options?.ignoreHooks?.length
          ? {
              __ignore_hooks: options.ignoreHooks,
            }
          : undefined,
      },
      options
    );
  }

  toJSON() {
    return this._LC_encode();
  }

  protected _LC_encode() {
    return {
      __type: 'Pointer',
      className: this.className,
      objectId: this.id,
    };
  }
}

export class LCObject {
  data: Record<string, any> = {};

  private _ref: LCObjectReference<LCObject>;
  private _rawData: Record<string, any> = {};

  get app() {
    return this._ref.app;
  }
  get className() {
    return this._ref.className;
  }
  get id() {
    return this._ref.id;
  }
  get createdAt(): Date {
    return this.data.createdAt;
  }
  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  constructor(ref: LCObjectReference<LCObject>);
  constructor(app: App, className: string, id: string);
  constructor(arg1: any, className?: string, id?: string) {
    if (className && id) {
      this._ref = new LCObjectReference(arg1, className, id, LCObject.fromJSON);
    } else {
      this._ref = arg1;
    }
  }

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
      return this._ref.toJSON();
    }
    return {
      ...this._rawData,
      __type: 'Object',
      className: this.className,
      objectId: this.id,
    };
  }

  protected _LC_getData(): Record<string, any> {
    return getLCObjectData(this.data);
  }

  toJSON(): Record<string, any> {
    return this._LC_getData();
  }

  get(options?: GetObjectOptions): Promise<LCObject> {
    return this._ref.get(options);
  }

  update(data: Record<string, any>, options?: UpdateObjectOptions): Promise<LCObject> {
    return this._ref.update(data, options);
  }

  delete(options?: DeleteObjectOptions): Promise<void> {
    return this._ref.delete(options);
  }
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

export function LCEncode(data: any, options?: EncodeOptions): any {
  if (!data) {
    return data;
  }

  if (data._LC_encode) {
    if (typeof data._LC_encode === 'function') {
      return data._LC_encode(options);
    }
    return LCEncode(data._LC_encode, options);
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
