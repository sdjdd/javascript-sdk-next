import { KEY_CURRENT_USER } from '../../common/const';
import type { App, AuthOptions, EncodeOptions, GetObjectOptions, LCObject } from '../../core';

const KEY_CURRENT_USER_PROMISE = KEY_CURRENT_USER + '-promise';

export interface UpdateUserOptions extends Omit<AuthOptions, 'sessionToken'> {
  // TODO: 支持按条件更新
  query?: any;
}

export class User {
  rawData: Record<string, any>;
  data: Record<string, any>;

  get className(): '_User' {
    return '_User';
  }
  get username(): string {
    return this.data.username;
  }
  get email(): string | undefined {
    return this.data.email;
  }
  get emailVerified(): boolean {
    return this.data.emailVerified;
  }
  get mobilePhoneNumber(): string | undefined {
    return this.data.mobilePhoneNumber;
  }
  get mobilePhoneVerified(): string {
    return this.data.mobilePhoneVerified;
  }
  get sessionToken(): string {
    return this.data.sessionToken;
  }
  get authData(): Record<string, any> | undefined {
    return this.data.authData;
  }
  get createdAt(): Date {
    return this.data.createdAt;
  }
  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  constructor(public readonly app: App, public readonly id: string) {}

  static fromJSON(app: App, json: any): User {
    const obj = app.database().decodeObject(json, '_User');
    const user = new User(app, obj.id);
    user.rawData = json;
    user.data = obj.data;
    return user;
  }

  static getCurrent(app: App): User | null {
    if (KEY_CURRENT_USER in app.payload) {
      return app.payload[KEY_CURRENT_USER];
    }
    if (KEY_CURRENT_USER_PROMISE in app.payload) {
      throw new Error('请使用异步方法获取当前登录用户');
    }
    const encodedUser = app.localStorage.get(KEY_CURRENT_USER);
    app.payload[KEY_CURRENT_USER] = encodedUser
      ? User.fromJSON(app, JSON.parse(encodedUser))
      : null;
    return app.payload[KEY_CURRENT_USER];
  }

  static async getCurrentAsync(app: App): Promise<User | null> {
    if (KEY_CURRENT_USER in app.payload) {
      return app.payload[KEY_CURRENT_USER];
    }
    if (KEY_CURRENT_USER_PROMISE in app.payload) {
      return await app.payload[KEY_CURRENT_USER_PROMISE];
    }
    app.payload[KEY_CURRENT_USER_PROMISE] = app.localStorage
      .getAsync(KEY_CURRENT_USER)
      .then((encodedUser) => {
        delete app.payload[KEY_CURRENT_USER_PROMISE];
        app.payload[KEY_CURRENT_USER] = encodedUser
          ? User.fromJSON(app, JSON.parse(encodedUser))
          : null;
        return app.payload[KEY_CURRENT_USER];
      });
    return await app.payload[KEY_CURRENT_USER_PROMISE];
  }

  static async setCurrentAsync(user: User): Promise<void> {
    user.app.payload[KEY_CURRENT_USER] = user;
    await user.app.localStorage.setAsync(KEY_CURRENT_USER, JSON.stringify(user));
  }

  static removeCurrent(app: App): void {
    delete app.payload[KEY_CURRENT_USER];
    app.localStorage.remove(KEY_CURRENT_USER);
  }

  static async removeCurrentAsync(app: App): Promise<void> {
    delete app.payload[KEY_CURRENT_USER];
    await app.localStorage.removeAsync(KEY_CURRENT_USER);
  }

  isCurrent(): boolean {
    return this === this.app.payload[KEY_CURRENT_USER];
  }

  isAnonymous(): boolean {
    return Boolean(this.authData?.anonymous);
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.app.request(
        {
          method: 'GET',
          path: '/1.1/users/me',
        },
        { sessionToken: this.sessionToken }
      );
      return true;
    } catch (error) {
      if (error.code === 211) {
        return false;
      }
      throw error;
    }
  }

  async updatePassword(
    oldPassword: string,
    newPassword: string,
    options?: Omit<AuthOptions, 'sessionToken'>
  ): Promise<void> {
    const rawData = await this.app.request(
      {
        method: 'PUT',
        path: `/1.1/users/${this.id}/updatePassword`,
        body: {
          old_password: oldPassword,
          new_password: newPassword,
        },
      },
      {
        ...options,
        sessionToken: this.sessionToken,
      }
    );
    Object.assign(this.rawData, rawData);
    this.data.sessionToken = rawData.sessionToken;
    this.data.updatedAt = new Date(rawData.updatedAt);
  }

  associateWithAuthData(
    platform: string,
    authDataItem: Record<string, any>,
    options?: UpdateUserOptions
  ): Promise<this> {
    return this.update({ authData: { [platform]: authDataItem } }, options);
  }

  associateWithAuthDataAndUnionId(
    platform: string,
    authDataItem: Record<string, any>,
    unionId: string,
    options?: UpdateUserOptions & {
      unionIdPlatform?: string;
      asMainAccount?: boolean;
    }
  ): Promise<this> {
    return this.associateWithAuthData(
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

  // async associateWithMiniApp(options?: )

  async get(options?: Omit<GetObjectOptions, 'sessionToken'>): Promise<this> {
    const obj = await this.app
      .database()
      .class(this.className)
      .object(this.id)
      .get({ ...options, sessionToken: this.sessionToken });
    this._merge(obj);
    if (this.isCurrent()) {
      await User.setCurrentAsync(this);
    }
    return this;
  }

  async update(data: Record<string, any>, options?: UpdateUserOptions): Promise<this> {
    const obj = await this.app
      .database()
      .class(this.className)
      .object(this.id)
      .update(data, {
        ...options,
        fetchUpdatedData: true,
        sessionToken: this.sessionToken,
      });
    this._merge(obj);
    if (this.isCurrent()) {
      await User.setCurrentAsync(this);
    }
    return this;
  }

  async delete(options: Omit<AuthOptions, 'sessionToken'>): Promise<void> {
    await this.app
      .database()
      .class(this.className)
      .object(this.id)
      .delete({
        ...options,
        sessionToken: this.sessionToken,
      });
    if (this.isCurrent()) {
      await this.app.localStorage.removeAsync(KEY_CURRENT_USER);
    }
  }

  toJSON(options?: EncodeOptions): Record<string, any> {
    if (options?.pointer) {
      return {
        __type: 'Pointer',
        className: this.className,
        objectId: this.id,
      };
    }
    return {
      ...this.rawData,
      __type: 'Object',
      className: this.className,
      objectId: this.id,
    };
  }

  private _merge(obj: LCObject): void {
    Object.assign(this.rawData, obj.rawData);
    Object.assign(this.data, obj.data);
  }
}
