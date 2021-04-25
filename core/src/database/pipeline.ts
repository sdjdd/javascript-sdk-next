import { APIError } from '../../../common/error';
import { App, AuthOptions } from '../app';
import {
  IgnoreHookOptions,
  LCObject,
  assertCanIgnoreHooks,
  makeUpdateObjectRequest,
  makeDeleteObjectRequest,
} from './lcobject';
import { makeAddObjectRequest } from './class';

type PipelineRequest =
  | {
      method: 'POST' | 'PUT';
      path: string;
      body: Record<string, any>;
    }
  | {
      method: 'GET';
      path: string;
    }
  | {
      method: 'DELETE';
      path: string;
      body?: Record<string, any>;
    };

export interface PipelineResult {
  results: any[];
  errors: Error[];
}

const deleteDecoder = () => undefined;

export class Pipeline {
  private _requests: PipelineRequest[] = [];
  private _decoders: ((data: Record<string, any>) => any)[] = [];
  private _ignoreHooks = false;

  constructor(public readonly app: App) {}

  private _get(className: string, objectId: string): void {
    this._requests.push({
      method: 'GET',
      path: `/1.1/classes/${className}/${objectId}`,
    });
    this._decoders.push((data) => LCObject.fromJSON(this.app, data, className));
  }

  private _update(
    className: string,
    objectId: string,
    data: Record<string, any>,
    options?: IgnoreHookOptions
  ): void {
    this._ignoreHooks ||= options?.ignoreBeforeHook || options?.ignoreAfterHook;
    const { method, path, body } = makeUpdateObjectRequest(className, objectId, data, options);
    this._requests.push({ method, path, body });
    this._decoders.push((data) => LCObject.fromJSON(this.app, data, className));
  }

  private _delete(className: string, objectId: string, options?: IgnoreHookOptions): void {
    this._ignoreHooks ||= options?.ignoreBeforeHook || options?.ignoreAfterHook;
    const { method, path, body } = makeDeleteObjectRequest(className, objectId, options);
    this._requests.push({ method, path, body });
    this._decoders.push(deleteDecoder);
  }

  add(className: string, data: Record<string, any>, options?: IgnoreHookOptions): this {
    this._ignoreHooks ||= options?.ignoreBeforeHook || options?.ignoreAfterHook;
    const { method, path, body } = makeAddObjectRequest(className, data, options);
    this._requests.push({ method, path, body });
    this._decoders.push((data) => LCObject.fromJSON(this.app, data, className));
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

  update(
    className: string,
    objectId: string,
    data: Record<string, any>,
    options?: IgnoreHookOptions
  ): this;
  update(
    object: { className: string; id: string },
    data: Record<string, any>,
    options?: IgnoreHookOptions
  ): this;
  update(
    arg1: string | { className: string; id: string },
    arg2?: string | Record<string, any>,
    arg3?: Record<string, any> | IgnoreHookOptions,
    options?: IgnoreHookOptions
  ): this {
    if (typeof arg1 === 'string') {
      if (typeof arg2 !== 'string') {
        throw new TypeError('The objectId must be a string');
      }
      this._update(arg1, arg2, arg3, options);
    } else {
      if (typeof arg2 === 'string') {
        throw new TypeError('The data must be an object');
      }
      this._update(arg1.className, arg1.id, arg2, arg3);
    }
    return this;
  }

  delete(className: string, objectId: string, options?: IgnoreHookOptions): this;
  delete(object: { className: string; id: string }, options?: IgnoreHookOptions): this;
  delete(
    arg1: string | { className: string; id: string },
    arg2?: string | IgnoreHookOptions,
    options?: IgnoreHookOptions
  ): this {
    if (typeof arg1 === 'string') {
      if (typeof arg2 !== 'string') {
        throw new TypeError('The objectId must be a string');
      }
      this._delete(arg1, arg2, options);
    } else {
      if (typeof arg2 === 'string') {
        throw new TypeError('The options must be an object');
      }
      this._delete(arg1.className, arg1.id, arg2);
    }
    return this;
  }

  async commit(options?: AuthOptions): Promise<PipelineResult> {
    if (this._ignoreHooks) {
      assertCanIgnoreHooks(this.app, options);
    }
    const actionResults = (await this.app.request(
      {
        method: 'POST',
        path: '/1.1/batch',
        body: {
          requests: this._requests,
        },
      },
      options
    )) as {
      success?: Record<string, any>;
      error?: {
        code: number;
        error: string;
      };
    }[];

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
