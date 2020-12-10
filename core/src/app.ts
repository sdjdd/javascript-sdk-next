import { clone, trimStart } from 'lodash';
import { HTTPRequest, RequestTask } from './http';
import { NamespacedStorage } from './local-storage';
import { log, LogItem } from './runtime';

export interface AuthOptions {
  useMasterKey?: boolean;
  user?: {
    sessionToken: string;
  };
}

export interface IAPIRequest {
  method: HTTPRequest['method'];
  path: string;
  header?: HTTPRequest['header'];
  query?: HTTPRequest['query'];
  body?: any;
}

export type BeforeInvokeAPI = (
  this: App,
  request: IAPIRequest,
  options: AuthOptions
) => void | Promise<void>;

interface AppHooks {
  beforeInvokeAPI: BeforeInvokeAPI;
}

export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL?: string;
  masterKey?: string;
}

export class App {
  static hooks = {
    beforeInvokeAPI: [] as BeforeInvokeAPI[],
  };
  static addHook<T extends keyof AppHooks>(name: T, hook: AppHooks[T]): void {
    this.hooks[name].push(hook);
  }

  readonly appId: string;
  readonly authOptions: AuthOptions = {};
  readonly payload: Record<string, any> = {};
  readonly storage: NamespacedStorage;

  useMasterKey = false;

  private _appKey: string;
  private _masterKey?: string;
  private _serverURL?: string;

  constructor(config: AppConfig) {
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
    if (!serverURL) {
      // TODO: 实现 app router
      throw new Error('The serverURL must be provided');
    }

    this.appId = appId;
    this._appKey = appKey;
    if (masterKey) {
      this._masterKey = masterKey.endsWith(',master') ? masterKey : masterKey + ',master';
    }
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
        await Promise.all(
          App.hooks.beforeInvokeAPI.map((hook) => hook.call(this, request, options))
        );

        const useMasterKey = options?.useMasterKey ?? this.useMasterKey;
        if (useMasterKey && !this._masterKey) {
          throw new Error('The masterKey is not set');
        }

        const user = options.user ?? this.authOptions.user;

        return {
          method: request.method,
          url: this._serverURL + '/' + trimStart(request.path, '/'),
          header: {
            ...request.header,
            'Content-Type': 'application/json',
            'X-LC-Id': this.appId,
            'X-LC-Key': useMasterKey ? this._masterKey : this._appKey,
            'X-LC-Session': user?.sessionToken,
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

  log(logItem: LogItem): void {
    log(logItem);
  }
}
