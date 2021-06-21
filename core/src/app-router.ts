import type { App } from './app';
import { request } from './http';

const KEY_SERVER_URLS = 'server_urls';

interface ServerURLs {
  stats_server: string;
  rtm_router_server: string;
  push_server: string;
  play_server: string;
  engine_server: string;
  api_server: string;
  ttl: number;
  expire_at: number;
}

export type Service = 'api' | 'engine' | 'push';

export function isCNApp(app: App): boolean {
  return app.appId.slice(-9) !== '-MdYXbMMI';
}

export class AppRouter {
  private _refreshing = false;
  private _urls?: ServerURLs;

  constructor(public readonly app: App) {}

  getDefaultServerURLs(ttl = 0): ServerURLs {
    const domain = isCNApp(this.app) ? 'lncld.net' : 'lncldglobal.com';
    const id = this.app.appId.slice(0, 8).toLowerCase();
    return {
      stats_server: `${id}.stats.${domain}`,
      rtm_router_server: `${id}.rtm.${domain}`,
      push_server: `${id}.push.${domain}`,
      play_server: `${id}.play.${domain}`,
      engine_server: `${id}.engine.${domain}`,
      api_server: `${id}.api.${domain}`,
      ttl: 0,
      expire_at: Date.now() + ttl * 1000,
    };
  }

  async getServerURLs(): Promise<ServerURLs> {
    if (!this._urls) {
      const urls = await this.app.localStorage.getAsync(KEY_SERVER_URLS);
      if (urls) {
        this._urls = JSON.parse(urls);
      } else {
        this._urls = this.getDefaultServerURLs();
      }
    }
    if (Date.now() >= this._urls.expire_at) {
      this.refresh();
    }
    return this._urls;
  }

  async refresh(): Promise<void> {
    if (this._refreshing) {
      return;
    }
    this._refreshing = true;

    try {
      const { body: urls } = await request({
        method: 'GET',
        url: 'https://app-router.com/2/route',
        query: {
          appId: this.app.appId,
        },
      });
      this._urls = {
        ...urls,
        expire_at: Date.now() + urls.ttl * 1000,
      };
      await this.app.localStorage.setAsync(KEY_SERVER_URLS, JSON.stringify(this._urls));
    } finally {
      this._refreshing = false;
    }
  }

  async getServiceURL(service: Service, schema = 'https'): Promise<string> {
    const urls = await this.getServerURLs();
    switch (service) {
      case 'api':
        return `${schema}://${urls.api_server}`;
      case 'engine':
        return `${schema}://${urls.engine_server}`;
      case 'push':
        return `${schema}://${urls.push_server}`;
      default:
        throw new Error('Unknown app router service: ' + service);
    }
  }
}
