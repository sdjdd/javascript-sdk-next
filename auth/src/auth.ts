import { v4 as uuid_v4 } from 'uuid';

import type { ACL, AddObjectOptions, App, AuthOptions, Query } from '../../core';
import { Role, RoleReference } from './role';
import { SDKRuntime } from './runtime';
import { User, UserReference } from './user';

export function setHooks(appClass: typeof App): void {
  appClass.beforeInvokeAPI(async (app, request, options) => {
    if (options.sessionToken) {
      return;
    }
    const user = await User.getCurrentAsync(app);
    if (user) {
      options.sessionToken = user.sessionToken;
    }
  });
}

export interface LoginWithAuthDataOptions extends AuthOptions {
  failOnNotExist?: boolean;
}

export interface LoginWithAuthDataAndUnionIdOptions extends LoginWithAuthDataOptions {
  unionIdPlatform?: string;
  asMainAccount?: boolean;
}

export type MiniAppAuthOptions = Record<string, any> & LoginWithAuthDataOptions;

export interface AuthOptionsWithCaptchaToken extends AuthOptions {
  validateToken?: string;
}

interface AddRoleData {
  ACL: ACL | Record<string, { read?: true; write?: true }>;
  name: string;
  users?: UserReference[] | UserReference | User[] | User;
  roles?: RoleReference[] | RoleReference | Role[] | Role;
}

export interface AuthHooks {
  afterLogin: ((this: Auth) => void | Promise<void>)[];
  beforeLogOut: ((this: Auth) => void | Promise<void>)[];
}

export class Auth {
  static readonly hooks: AuthHooks = {
    afterLogin: [],
    beforeLogOut: [],
  };

  get currentUser(): User | null {
    return this.getCurrentUser();
  }

  constructor(public readonly app: App) {}

  user(id: string): UserReference {
    return new UserReference(this.app, id);
  }

  role(id: string): RoleReference {
    return new RoleReference(this.app, id);
  }

  async addRole(data: AddRoleData, options?: AddObjectOptions): Promise<Role> {
    const { ACL, name, users, roles } = data;
    if (!data.ACL || !data.name) {
      throw new Error('The role name and ACL is required');
    }

    const db = this.app.database();
    const rawData = await this.app.request(
      {
        method: 'POST',
        path: '/1.1/roles',
        query: {
          fetchWhenSave: options?.fetchData,
        },
        body: db.encodeObjectData({
          ...data,
          name,
          ACL,
          users: users ? db.op.addRelation(users) : undefined,
          roles: roles ? db.op.addRelation(roles) : undefined,
        }),
      },
      options
    );

    return Role.fromJSON(this.app, rawData);
  }

  queryUser(): Query<User> {
    return this.app.database().class('_User', User.fromJSON);
  }

  queryRole(): Query<Role> {
    return this.app.database().class('_Role', Role.fromJSON);
  }

  getCurrentUser(cachedOnly = false): User | null {
    return User.getCurrent(this.app, cachedOnly);
  }

  getCurrentUserAsync(): Promise<User | null> {
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
    data: Record<string, any> & {
      mobilePhoneNumber: string;
      smsCode: string;
    },
    options?: AuthOptions
  ): Promise<User> {
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

  async login(data: Record<string, any>, options?: AuthOptions): Promise<User>;
  async login(username: string, password: string, options?: AuthOptions): Promise<User>;
  async login(
    arg1: Record<string, any> | string,
    arg2?: AuthOptions | string,
    arg3?: AuthOptions
  ): Promise<User> {
    let body: Record<string, any>;
    let options: AuthOptions;
    if (typeof arg1 === 'string') {
      if (typeof arg2 !== 'string') {
        throw new Error('参数 password 必须是 string');
      }
      body = {
        username: arg1,
        password: arg2,
      };
      options = arg3;
    } else {
      body = arg1;
      options = arg2 as AuthOptions;
    }
    return this._decodeAndSetCurrent(
      await this.app.request(
        {
          method: 'POST',
          path: '/1.1/login',
          body,
        },
        options
      )
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

  loginAnonymously(options?: AuthOptions): Promise<User> {
    const authData = {
      id: uuid_v4(),
    };
    return this.loginWithAuthData('anonymous', authData, options);
  }

  async loginWithAuthData(
    platform: string,
    authDataItem: Record<string, any>,
    options?: LoginWithAuthDataOptions
  ): Promise<User> {
    return this._decodeAndSetCurrent(
      await this.app.request(
        {
          method: 'POST',
          path: '/1.1/users',
          query: {
            failOnNotExist: options?.failOnNotExist,
          },
          body: {
            authData: {
              [platform]: authDataItem,
            },
          },
        },
        options
      )
    );
  }

  loginWithAuthDataAndUnionId(
    platform: string,
    authDataItem: Record<string, any>,
    unionId: string,
    options?: LoginWithAuthDataAndUnionIdOptions
  ): Promise<User> {
    return this.loginWithAuthData(
      platform,
      {
        ...authDataItem,
        unionid: unionId,
        platform: options?.unionIdPlatform || 'weixin',
        main_account: options?.asMainAccount,
      },
      options
    );
  }

  async loginWithMiniApp(options?: MiniAppAuthOptions): Promise<User> {
    const getAuthInfo = SDKRuntime.getAdapter('getAuthInfo');
    const { provider, authData } = await getAuthInfo(options);
    return this.loginWithAuthData(provider, authData, options);
  }

  async loginWithMiniAppAndUnionId(
    unionId: string,
    options?: MiniAppAuthOptions & Pick<LoginWithAuthDataAndUnionIdOptions, 'asMainAccount'>
  ): Promise<User> {
    const getAuthInfo = SDKRuntime.getAdapter('getAuthInfo');
    const { provider, authData, platform } = await getAuthInfo(options);
    return this.loginWithAuthDataAndUnionId(provider, authData, unionId, {
      ...options,
      unionIdPlatform: platform,
    });
  }

  async logOut(): Promise<void> {
    await Promise.all(Auth.hooks.beforeLogOut.map((h) => h.call(this)));
    await User.removeCurrentAsync(this.app);
  }

  requestEmailVerify(email: string, options?: AuthOptions): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/1.1/requestEmailVerify',
        body: { email },
      },
      options
    );
  }

  requestLoginSMSCode(
    mobilePhoneNumber: string,
    options?: AuthOptionsWithCaptchaToken
  ): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/1.1/requestLoginSmsCode',
        body: {
          mobilePhoneNumber,
          validate_token: options?.validateToken,
        },
      },
      options
    );
  }

  requestMobilePhoneVerify(
    mobilePhoneNumber: string,
    options?: AuthOptionsWithCaptchaToken
  ): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/1.1/requestMobilePhoneVerify',
        body: {
          mobilePhoneNumber,
          validate_token: options?.validateToken,
        },
      },
      options
    );
  }

  requestPasswordReset(email: string, options?: AuthOptions): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/1.1/requestPasswordReset',
        body: { email },
      },
      options
    );
  }

  requestPasswordResetBySMSCode(
    mobilePhoneNumber: string,
    options?: AuthOptionsWithCaptchaToken
  ): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/1.1/requestPasswordResetBySmsCode',
        body: {
          mobilePhoneNumber,
          validate_token: options?.validateToken,
        },
      },
      options
    );
  }

  resetPasswordBySMSCode(smsCode: string, password: string, options?: AuthOptions): Promise<void> {
    return this.app.request(
      {
        method: 'PUT',
        path: `/1.1/resetPasswordBySmsCode/${smsCode}`,
        body: { password },
      },
      options
    );
  }

  verifyMobilePhone(smsCode: string, options?: AuthOptions): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: `/1.1/verifyMobilePhone/${smsCode}`,
      },
      options
    );
  }

  requestChangePhoneNumber(
    mobilePhoneNumber: string,
    optoins?: AuthOptionsWithCaptchaToken & { ttl?: number }
  ): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/requestChangePhoneNumber',
        body: {
          mobilePhoneNumber,
          ttl: optoins?.ttl,
        },
      },
      optoins
    );
  }

  changePhoneNumber(
    mobilePhoneNumber: string,
    smsCode: string,
    options?: AuthOptions
  ): Promise<void> {
    return this.app.request(
      {
        method: 'POST',
        path: '/1.1/changePhoneNumber',
        body: {
          mobilePhoneNumber,
          code: smsCode,
        },
      },
      options
    );
  }

  private async _decodeAndSetCurrent(data: any): Promise<User> {
    const user = User.fromJSON(this.app, data);
    await User.setCurrentAsync(user);
    await Promise.all(Auth.hooks.afterLogin.map((h) => h.call(this)));
    return user;
  }

  static afterLogin(h: AuthHooks['afterLogin'][number]): void {
    Auth.hooks.afterLogin.push(h);
  }

  static beforeLogOut(h: AuthHooks['beforeLogOut'][number]): void {
    Auth.hooks.beforeLogOut.push(h);
  }
}
