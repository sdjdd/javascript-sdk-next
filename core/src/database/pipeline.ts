import { APIError } from '../../../common/error';
import { App, AuthOptions } from '../app';
import { encodeObjectData, LCObject, LCObjectData } from './lcobject';

type PipelineRequest =
  | {
      method: 'POST' | 'PUT';
      path: string;
      body: Record<string, any>;
    }
  | {
      method: 'GET' | 'DELETE';
      path: string;
    };

export interface PipelineResult {
  results: any[];
  errors: Error[];
}

interface ActionResult {
  success?: Record<string, any>;
  error?: {
    code: number;
    error: string;
  };
}

const deleteDecoder = () => undefined;

export class Pipeline {
  private _requests: PipelineRequest[] = [];
  private _decoders: ((data: Record<string, any>) => any)[] = [];

  constructor(public readonly app: App) {}

  private _add(className: string, data: LCObjectData): void {
    this._requests.push({
      method: 'POST',
      path: `/1.1/classes/${className}`,
      body: encodeObjectData(data),
    });
    this._decoders.push((data) => LCObject.fromJSON(this.app, data, className));
  }

  private _get(className: string, objectId: string): void {
    this._requests.push({
      method: 'GET',
      path: `/1.1/classes/${className}/${objectId}`,
    });
    this._decoders.push((data) => LCObject.fromJSON(this.app, data, className));
  }

  private _update(className: string, objectId: string, data: LCObjectData): void {
    this._requests.push({
      method: 'PUT',
      path: `/1.1/classes/${className}/${objectId}`,
      body: encodeObjectData(data),
    });
    this._decoders.push((data) => LCObject.fromJSON(this.app, data, className));
  }

  private _delete(className: string, objectId: string): void {
    this._requests.push({
      method: 'DELETE',
      path: `/1.1/classes/${className}/${objectId}`,
    });
    this._decoders.push(deleteDecoder);
  }

  add(className: string, data: LCObjectData | LCObjectData[]): this {
    if (Array.isArray(data)) {
      data.forEach((data) => this._add(className, data));
    } else {
      this._add(className, data);
    }
    return this;
  }

  get(className: string, objectId: string): this;
  get(object: { className: string; id: string }): this;
  get(arg1: string | { className: string; id: string }, objectId?: string): this {
    if (typeof arg1 === 'string') {
      this._get(arg1, objectId);
    } else {
      this._get(arg1.className, arg1.id);
    }
    return this;
  }

  update(className: string, objectId: string, data: LCObjectData): this;
  update(object: { className: string; id: string }, data: LCObjectData): this;
  update(
    arg1: string | { className: string; id: string },
    arg2?: string | LCObjectData,
    data?: LCObjectData
  ): this {
    if (typeof arg1 === 'string') {
      if (typeof arg2 !== 'string') {
        throw new TypeError('objectId 必须是 string');
      }
      this._update(arg1, arg2, data);
    } else {
      this._update(arg1.className, arg1.id, arg2 as LCObjectData);
    }
    return this;
  }

  delete(className: string, objectId: string): this;
  delete(object: { className: string; id: string }): this;
  delete(arg1: string | { className: string; id: string }, objectId?: string): this {
    if (typeof arg1 === 'string') {
      this._delete(arg1, objectId);
    } else {
      this._delete(arg1.className, arg1.id);
    }
    return this;
  }

  async commit(options?: AuthOptions): Promise<PipelineResult> {
    const actionResults = (await this.app.request(
      {
        method: 'POST',
        path: '/1.1/batch',
        body: {
          requests: this._requests,
        },
      },
      options
    )) as ActionResult[];

    const results: any[] = [];
    const errors: APIError[] = [];
    actionResults.forEach((result, index) => {
      if (result.error) {
        const { code, error } = result.error;
        errors.push(new APIError(code, error));
      } else {
        results.push(this._decoders[index](result.success));
      }
    });

    return { results, errors };
  }
}
