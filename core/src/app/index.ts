import { trimStart } from 'lodash';
import { RequestTask } from '../http';
import { IHTTPRequest } from '../http/request';
import { NamespacedStorage } from '../local-storage';

export interface IAppConfig {
  appId: string;
  appKey: string;
  serverURL?: string;
}

export interface IAPIRequest {
  method: IHTTPRequest['method'];
  path: string;
  header?: IHTTPRequest['header'];
  query?: IHTTPRequest['query'];
  body?: any;
}

export class App {
  readonly appId: string;
  readonly authOptions: {
    sessionToken?: string;
  } = {};
  readonly payload: Record<string, any> = {};
  readonly storage: NamespacedStorage;

  private _appKey: string;
  private _serverURL?: string;

  constructor(config: IAppConfig) {
    if (!config) {
      throw new Error('The app config is necessary when construct an App');
    }
    const { appId, appKey, serverURL } = config;
    if (!appId) {
      throw new Error('The appId must be provided');
    }
    if (!appKey) {
      throw new Error('The appKey must be provided');
    }

    this.appId = appId;
    this._appKey = appKey;
    this._serverURL = serverURL;
    this.storage = new NamespacedStorage(appId);
  }

  api(req: IAPIRequest): RequestTask<any>;
  api<T>(req: IAPIRequest, after: (body: any) => T): RequestTask<T>;
  api(req: IAPIRequest, after?: (body: any) => any): RequestTask<any> {
    return new RequestTask(
      async () => {
        return {
          method: req.method,
          url: this._serverURL + '/' + trimStart(req.path, '/'),
          header: {
            ...req.header,
            'Content-Type': 'application/json',
            'X-LC-Id': this.appId,
            'X-LC-Key': this._appKey,
            'X-LC-Session': this.authOptions.sessionToken,
          },
          query: req.query,
          body: req.body,
        };
      },
      ({ status, body }) => {
        if (status >= 400) {
          const { code, error } = body;
          throw new Error(`${code}: ${error}`);
        }
        if (after) {
          return after(body);
        }
        return body;
      }
    );
  }
}
