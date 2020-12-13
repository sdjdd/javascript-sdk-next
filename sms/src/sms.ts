import { App, AuthOptions } from '../../core';

export interface RequestSMSCodeOptions extends AuthOptions {
  smsType?: string;
  ttl?: number;
  name?: string;
  op?: string;
  template?: string;
  sign?: string;
  validateToken?: string;
  variables?: Record<string, any>;
}

export class SMS {
  constructor(public readonly app: App) {}

  requestCode(mobilePhoneNumber: string, options?: RequestSMSCodeOptions): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/1.1/requestSmsCode',
        body: {
          ...options?.variables,
          mobilePhoneNumber,
          smsType: options?.smsType,
          ttl: options?.ttl,
          name: options?.name,
          op: options?.op,
          template: options?.template,
          sign: options?.sign,
          validate_token: options?.validateToken,
        },
      },
      options
    );
  }
}
