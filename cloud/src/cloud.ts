import type { App, AuthOptions } from '../../core';
import { Captcha, RequestCaptchaOptions } from './captcha';

export class Cloud {
  constructor(public readonly app: App) {}

  async getServerTime(): Promise<Date> {
    const { iso } = (await this.app.request({
      method: 'GET',
      path: '/1.1/date',
    })) as { iso: string };
    return new Date(iso);
  }

  requestCaptcha(options?: RequestCaptchaOptions): Promise<Captcha> {
    return new Captcha(this.app).refresh(options);
  }

  async run(funcName: string, param?: any, options?: AuthOptions): Promise<any> {
    const { result } = await this.app.request(
      {
        method: 'POST',
        service: 'engine',
        path: `/1.1/functions/${funcName}`,
        body: this.app.database().encode(param),
      },
      options
    );
    return result;
  }

  async rpc(funcName: string, param?: any, options?: AuthOptions): Promise<any> {
    const db = this.app.database();
    const { result } = await this.app.request(
      {
        method: 'POST',
        service: 'engine',
        path: `/1.1/call/${funcName}`,
        body: db.encode(param),
      },
      options
    );
    return db.decode(result);
  }
}
