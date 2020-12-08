import { clone, trimStart } from 'lodash';
import { RequestTask } from '../http';
import { IHTTPRequest } from '../http/request';
import { NamespacedStorage } from '../local-storage';

export interface IAppConfig {
  appId: string;
  appKey: string;
  serverURL?: string;
  masterKey?: string;
}

export interface IAPIRequest {
  method: IHTTPRequest['method'];
  path: string;
  header?: IHTTPRequest['header'];
  query?: IHTTPRequest['query'];
  body?: any;
}

export interface AuthOptions {
  useMasterKey?: boolean;
  sessionToken?: string;
}

export type BeforeInvokeAPI = (
  this: App,
  request: IAPIRequest,
  options: AuthOptions
) => void | Promise<void>;

interface AppHooks {
  beforeInvokeAPI: BeforeInvokeAPI;
}

export class App {
  static hooks = {
    beforeInvokeAPI: new Set<BeforeInvokeAPI>(),
  };
  static addHook<T extends keyof AppHooks>(name: T, hook: AppHooks[T]): void {
    this.hooks[name].add(hook);
  }

  readonly appId: string;
  readonly authOptions: AuthOptions = {};
  readonly payload: Record<string, any> = {};
  readonly storage: NamespacedStorage;

  useMasterKey = false;

  private _appKey: string;
  private _masterKey?: string;
  private _serverURL?: string;

  constructor(config: IAppConfig) {
    if (!config) {
      throw new Error('The app config is necessary when construct an App');
    }
    const { appId, appKey, masterKey, serverURL } = config;
    if (!appId) {
      throw new Error('The appId must be provided');
    }
    if (!appKey) {
      throw new Error('The appKey must be provided');
    }

    this.appId = appId;
    this._appKey = appKey;
    this._masterKey = masterKey.endsWith(',master') ? masterKey : masterKey + ',master';
    this._serverURL = serverURL;
    this.storage = new NamespacedStorage(appId);
  }

  api<T = any>(
    request: IAPIRequest,
    options?: AuthOptions & { after?: (body: any) => T }
  ): RequestTask<T> {
    request = clone(request);
    options = clone(options) || {};

    return new RequestTask(
      async () => {
        App.hooks.beforeInvokeAPI.forEach(async (hook) => {
          await hook.call(this, request, options);
        });

        const useMasterKey = options?.useMasterKey ?? this.useMasterKey;
        if (useMasterKey && !this._masterKey) {
          throw new Error('The masterKey is not set');
        }

        const sessionToken = options.sessionToken ?? this.authOptions.sessionToken;

        return {
          method: request.method,
          url: this._serverURL + '/' + trimStart(request.path, '/'),
          header: {
            ...request.header,
            'Content-Type': 'application/json',
            'X-LC-Id': this.appId,
            'X-LC-Key': useMasterKey ? this._masterKey : this._appKey,
            'X-LC-Session': sessionToken,
          },
          query: request.query,
          body: request.body,
        };
      },

      ({ status, body }) => {
        if (status >= 400) {
          const { code, error } = body;
          throw new Error(`${code}: ${error}`);
        }
        return options.after ? options.after(body) : body;
      }
    );
  }
}
