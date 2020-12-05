import { HTTPMethod, AbortSignal as IAbortSignal, ProgressEvent } from '@leancloud/adapter-types';
import { noop } from 'lodash';
import { mustGetAdapter } from '../adapters';
import { IQuery } from './query';

export interface IHTTPRequest {
  method: HTTPMethod;
  url: string;
  header?: Record<string, string | undefined>;
  query?: IQuery;
  body?: any;
}

export interface IHTTPResponse {
  status: number;
  header: Record<string, string>;
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

export class RequestTask<T = IHTTPResponse> extends Promise<T> {
  private _signal: AbortSignal;
  private _slienceAbort?: boolean;
  private _progressListeners?: ((event: ProgressEvent) => void)[];

  static get [Symbol.species]() {
    return Promise;
  }

  constructor(
    request: IHTTPRequest | (() => IHTTPRequest | Promise<IHTTPRequest>),
    options?: {
      before?: (req: IHTTPRequest) => IHTTPRequest | void;
      after?: (res: IHTTPResponse) => T;
    }
  ) {
    const doRequest = mustGetAdapter('request');
    const signal = new AbortSignal();

    super((resolve, reject) => {
      Promise.resolve(typeof request === 'function' ? request() : request).then((request) => {
        let req = request;
        if (options?.before) {
          req = options.before(req) || req;
        }

        const { method, url } = req;
        doRequest(url, {
          method,
          signal,
          onprogress: (event) => {
            this._progressListeners?.forEach((h) => h(event));
          },
        })
          .then(({ status, headers, data }) => {
            const res: IHTTPResponse = {
              status: status || 200,
              header: (headers as any) || {},
              body: data,
            };
            if (options?.after) {
              resolve(options.after(res));
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
