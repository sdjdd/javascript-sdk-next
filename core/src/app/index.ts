import { RequestTask } from '../http';
import { IHTTPRequest } from '../http/request';

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
  }

  api(req: IAPIRequest): RequestTask<any> {
    return new RequestTask(
      async () => {
        return {
          method: req.method,
          url: this._serverURL + '/' + req.path,
          header: req.header,
          query: req.query,
          body: req.body,
        };
      },
      ({ status, body }) => {
        if (status >= 400) {
          throw new Error();
        }
        return body;
      }
    );
  }
}
