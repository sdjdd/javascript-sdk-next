import pick from 'lodash/pick';

import type { App, AuthOptions } from '../../core';

export interface RequestCaptchaOptions extends AuthOptions {
  width?: number;
  height?: number;
  size?: number;
  ttl?: number;
}

export class Captcha {
  token: string;
  url: string;
  validateToken: string;

  constructor(public readonly app: App) {}

  async refresh(options?: RequestCaptchaOptions): Promise<this> {
    this.validateToken = undefined;
    const { captcha_token, captcha_url } = await this.app.request(
      {
        method: 'GET',
        path: '/1.1/requestCaptcha',
        query: pick(options, ['width', 'height', 'size', 'ttl']),
      },
      options
    );
    this.token = captcha_token;
    this.url = captcha_url;
    return this;
  }

  async verify(code: string, options?: AuthOptions): Promise<string> {
    if (!this.token) {
      throw new Error('验证码 token 为空，请刷新验证码后重试');
    }
    const { validate_token } = await this.app.request(
      {
        method: 'POST',
        path: '/verifyCaptcha',
        body: {
          captcha_code: code,
          captcha_token: this.token,
        },
      },
      options
    );
    this.validateToken = validate_token;
    return this.validateToken;
  }
}
