import clone from 'lodash/clone';
import trimStart from 'lodash/trimStart';

import { APIError } from '../../common/error';
import { Database } from './database';
import { request as doHTTPRequest, HTTPRequest, HTTPRequestOptions } from './http';
import { localStorage, NamespacedStorage } from './local-storage';
import { log } from './log';
import { getUserAgent } from './userAgent';

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

export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL?: string;
  masterKey?: string;
  useMasterKey?: boolean;
  production?: boolean;
}

export class App {
  static hooks = {
    beforeInvokeAPI: [] as BeforeInvokeAPI[],
  };

  readonly appId: string;
  readonly appKey: string;
  readonly serverURL?: string;

  readonly log = {
    trace: (label: string, data: Record<string, any>) => {
      log.trace(label, { appId: this.appId, ...data });
    },
    info: (label: string, data: Record<string, any>) => {
      log.info(label, { appId: this.appId, ...data });
    },
    error: (label: string, data: Record<string, any>) => {
      log.error(label, { appId: this.appId, ...data });
    },
  };

  readonly payload: Record<string, any> = {};
  readonly localStorage: NamespacedStorage;

  useMasterKey: boolean;
  production: boolean;

  private _masterKey?: string;

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
    this.appKey = appKey;
    if (masterKey) {
      this._masterKey = masterKey.endsWith(',master') ? masterKey : masterKey + ',master';
    }
    this.serverURL = serverURL;
    this.useMasterKey = Boolean(config.useMasterKey);
    this.production = Boolean(config.production ?? true);
    this.localStorage = new NamespacedStorage(localStorage, appId);
  }

  database(): Database {
    return new Database(this);
  }

  async request(request: APIRequest, options: AuthOptions = {}): Promise<any> {
    request = clone(request);
    options = clone(options);
    await Promise.all(App.hooks.beforeInvokeAPI.map((h) => h(this, request, options)));

    const useMasterKey = options?.useMasterKey ?? this.useMasterKey;
    if (useMasterKey && !this._masterKey) {
      throw new Error('useMasterKey 已开启，但 masterKey 为空');
    }

    const { status, body } = await doHTTPRequest({
      ...request,
      url: this.serverURL + '/' + trimStart(request.path, '/'),
      header: {
        ...request.header,
        'Content-Type': 'application/json',
        'X-LC-UA': getUserAgent(),
        'X-LC-Id': this.appId,
        'X-LC-Key': useMasterKey ? this._masterKey : this.appKey,
        'X-LC-Session': options?.sessionToken,
        'X-LC-Prod': this.production ? undefined : '0',
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

  static beforeInvokeAPI(h: BeforeInvokeAPI): void {
    App.hooks.beforeInvokeAPI.push(h);
  }
}
