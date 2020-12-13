import type { App, AuthOptions } from '../../core';
import { User } from './user';

export function setHooks(appClass: typeof App): void {
  appClass.addHook('beforeInvokeAPI', async function (_, options) {
    if (options.sessionToken) {
      return;
    }
    const currentUser = await User.getCurrentAsync(this);
    if (currentUser) {
      options.sessionToken = currentUser.sessionToken;
    }
  });
}

export class Auth {
  constructor(public readonly app: App) {}

  currentUser(): User | null {
    return User.getCurrent(this.app);
  }

  currentUserAsync(): Promise<User | null> {
    return User.getCurrentAsync(this.app);
  }

  async signUp(data: Record<string, any>, options?: AuthOptions): Promise<User> {
    return this._decodeAndSetCurrent(
      await this.app.request(
        {
          method: 'POST',
          path: '/1.1/users',
          body: this.app.database().encodeObjectData(data),
        },
        options
      )
    );
  }

  async signUpOrLoginWithMobilePhone(
    phone: string,
    smsCode: string,
    options?: AuthOptions
  ): Promise<User>;
  async signUpOrLoginWithMobilePhone(
    data: Record<string, any> & { mobilePhoneNumber: string },
    smsCode: string,
    options?: AuthOptions
  ): Promise<User>;
  async signUpOrLoginWithMobilePhone(
    data: any,
    smsCode: string,
    options?: AuthOptions
  ): Promise<User> {
    if (typeof data === 'string') {
      data = { mobilePhoneNumber: data, smsCode };
    }
    return this._decodeAndSetCurrent(
      await this.app.request(
        {
          method: 'POST',
          path: `/1.1/usersByMobilePhone`,
          body: this.app.database().encodeObjectData(data),
        },
        options
      )
    );
  }

  async login(username: string, password: string): Promise<User> {
    return this._decodeAndSetCurrent(
      await this.app.request({
        method: 'POST',
        path: '/1.1/login',
        body: { username, password },
      })
    );
  }

  async loginWithSessionToken(sessionToken: string): Promise<User> {
    return this._decodeAndSetCurrent(
      await this.app.request(
        {
          method: 'GET',
          path: '/1.1/users/me',
        },
        {
          sessionToken,
        }
      )
    );
  }

  private async _decodeAndSetCurrent(data: any): Promise<User> {
    const user = User.fromJSON(this.app, data);
    await User.setCurrentAsync(user);
    return user;
  }
}
