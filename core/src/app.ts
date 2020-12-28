import { Adapters } from '@leancloud/adapter-types';
import clone from 'lodash/clone';
import trimStart from 'lodash/trimStart';
import { mustGetAdapter } from './adapter';

import { Database } from './database';
import { doHTTPRequest, getUserAgent, HTTPRequest, HTTPRequestOptions } from './http';
import { localStorage, NamespacedStorage } from './local-storage';
import { log } from './runtime';

export interface AuthOptions extends HTTPRequestOptions {
  useMasterKey?: boolean;
  sessionToken?: string;
}

export interface APIRequest {
  method: HTTPRequest['method'];
  path: string;
  header?: HTTPRequest['header'];
  query?: HTTPRequest['query'];
  body?: any;
}

export type BeforeInvokeAPI = (
  app: App,
  request: APIRequest,
  options: AuthOptions
) => void | Promise<void>;

export type OnAppCreated = (app: App) => void;

export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL?: string;
  masterKey?: string;
}

export class App {
  static hooks = {
    beforeInvokeAPI: [] as BeforeInvokeAPI[],
    onCreated: [] as OnAppCreated[],
  };

  readonly appId: string;
  readonly payload: Record<string, any> = {};
  readonly localStorage: NamespacedStorage;
  readonly log = log;

  useMasterKey = false;

  private _appKey: string;
  private _masterKey?: string;
  private _serverURL?: string;

  constructor(config: AppConfig) {
    if (!config) {
      throw new Error('请提供必要的信息来初始化 App');
    }
    const { appId, appKey, masterKey, serverURL } = config;
    if (!appId) {
      throw new Error('初始化 App 时必须提供 appId');
    }
    if (!appKey) {
      throw new Error('初始化 App 时必须提供 appKey');
    }
    if (!serverURL) {
      // TODO: 实现 app router
      throw new Error('初始化 App 时必须提供 serverURL');
    }

    this.appId = appId;
    this._appKey = appKey;
    if (masterKey) {
      this._masterKey = masterKey.endsWith(',master') ? masterKey : masterKey + ',master';
    }
    this._serverURL = serverURL;
    this.localStorage = new NamespacedStorage(localStorage, appId);

    App.hooks.onCreated.forEach((h) => h(this));
  }

  database(): Database {
    return new Database(this);
  }

  async request(request: APIRequest, options?: AuthOptions): Promise<any> {
    request = clone(request);
    options = clone(options) || {};
    await Promise.all(App.hooks.beforeInvokeAPI.map((h) => h(this, request, options)));

    const useMasterKey = options?.useMasterKey ?? this.useMasterKey;
    if (useMasterKey && !this._masterKey) {
      throw new Error('useMasterKey 已开启，但 masterKey 为空');
    }

    const { status, body } = await doHTTPRequest({
      ...request,
      url: this._serverURL + '/' + trimStart(request.path, '/'),
      header: {
        ...request.header,
        'Content-Type': 'application/json',
        'X-LC-UA': getUserAgent(),
        'X-LC-Id': this.appId,
        'X-LC-Key': useMasterKey ? this._masterKey : this._appKey,
        'X-LC-Session': options?.sessionToken,
      },
    });

    if (status >= 400) {
      const { code, error } = body;
      if (code && error) {
        throw new APIError(code, error);
      }
      throw new Error(JSON.stringify(body));
    }

    return body;
  }

  getAdapter<T extends keyof Adapters>(name: T): Adapters[T] | never {
    return mustGetAdapter(name);
  }

  static onCreated(h: OnAppCreated): void {
    App.hooks.onCreated.push(h);
  }

  static beforeInvokeAPI(h: BeforeInvokeAPI): void {
    App.hooks.beforeInvokeAPI.push(h);
  }
}

export class APIError extends Error {
  constructor(public code: number, public error: string) {
    super(`code: ${code}, error: ${error}`);
  }
}
