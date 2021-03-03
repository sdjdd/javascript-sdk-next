import type { App, AuthOptions, Query } from '../../core';
import { Captcha, RequestCaptchaOptions } from './captcha';

export interface PushOptions extends AuthOptions {
  query?: Query<any>;
  channels?: string[];
  pushTime?: Date;
  expirationTime?: Date;
  expirationInterval?: number;
  notificationId?: string;
  reqId?: string;
  prod?: 'prod' | 'dev';
  topic?: string;
  apnsTeamId?: string;
  flowControl?: number;
  notificationChannel?: string;
}

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

  async sendPushNotification(data: Record<string, any>, options?: PushOptions): Promise<void> {
    if (options?.expirationTime && options?.expirationInterval) {
      throw new Error('Cannot set both expirationTime and expirationInterval');
    }
    await this.app.request(
      {
        service: 'push',
        method: 'POST',
        path: '/1.1/push',
        body: {
          data,
          where: options?.query?.params.where,
          channels: options?.channels,
          push_time: options?.pushTime?.toISOString(),
          expiration_time: options?.expirationTime?.toISOString(),
          expiration_interval: options?.expirationInterval,
          notification_id: options?.notificationId,
          req_id: options?.reqId,
          prod: options?.prod,
          topic: options?.topic,
          apns_team_id: options?.apnsTeamId,
          flow_control: options?.flowControl,
          _notificationChannel: options?.notificationChannel,
        },
      },
      options
    );
  }
}
