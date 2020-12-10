import { HTTPMethod, AbortSignal as IAbortSignal, ProgressEvent } from '@leancloud/adapter-types';
import { RequestTask as IRequestTask } from '../../types/core';
import { isUndefined, noop, omitBy } from 'lodash';
import { mustGetAdapter } from './adapters';

export interface HTTPRequest {
  method: HTTPMethod;
  url: string;
  header?: Record<string, string | undefined>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: any;
}

export interface HTTPResponse {
  status: number;
  header?: Record<string, string>;
  body?: any;
}

class AbortSignal implements IAbortSignal {
  onabort: () => void = noop;

  private _aborted = false;
  private _abortListeners: (() => void)[] = [];

  get aborted() {
    return this._aborted;
  }

  addEventListener(event: 'abort', listener: () => void): void {
    if (event === 'abort') {
      this._abortListeners.push(listener);
    }
  }

  abort() {
    if (this._aborted) {
      return;
    }
    this._aborted = true;
    this.onabort?.();
    this._abortListeners.forEach((h) => h());
  }
}

export function encodeQuery(query: HTTPRequest['query']): string {
  let str = '';
  Object.entries(query).forEach(([key, value], index) => {
    if (value === undefined) {
      return;
    }

    if (index) {
      str += '&';
    }
    str += key + '=' + encodeURIComponent(value);
  });
  return str;
}

export function encodeURL(base: string, query?: HTTPRequest['query']): string {
  if (query) {
    const queryString = encodeQuery(query);
    if (queryString) {
      return base + '?' + queryString;
    }
  }
  return base;
}

export class RequestTask<T = HTTPResponse> extends Promise<T> implements IRequestTask<T> {
  private _signal: AbortSignal;
  private _slienceAbort?: boolean;
  private _progressListeners?: ((event: ProgressEvent) => void)[];

  static get [Symbol.species]() {
    return Promise;
  }

  constructor(
    request: HTTPRequest | (() => HTTPRequest | Promise<HTTPRequest>),
    after?: (res: HTTPResponse) => T
  ) {
    const doRequest = mustGetAdapter('request');
    const signal = new AbortSignal();

    super((resolve, reject) => {
      Promise.resolve(typeof request === 'function' ? request() : request).then((request) => {
        console.log(request);
        const { method, url, header, query, body } = request;
        doRequest(encodeURL(url, query), {
          method,
          headers: omitBy(header, isUndefined),
          data: body,
          signal,
          onprogress: (event) => {
            this._progressListeners?.forEach((h) => h(event));
          },
        })
          .then(({ status, headers, data }) => {
            const res: HTTPResponse = {
              status: status || 200,
              header: (headers as any) || {},
              body: data,
            };
            if (after) {
              resolve(after(res));
            } else {
              resolve(res as any);
            }
          })
          .catch((error) => {
            if (error.name === 'AbortError' && this._slienceAbort) {
              return;
            }
            reject(error);
          });
      });
    });

    this._signal = signal;
  }

  onProgress(listener: (event: ProgressEvent) => void): void {
    if (!this._progressListeners) {
      this._progressListeners = [listener];
    } else {
      this._progressListeners.push(listener);
    }
  }

  abort(slience = false): void {
    this._slienceAbort = slience;
    this._signal.abort();
  }
}
