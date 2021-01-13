import { KEY_CURRENT_USER } from '../../common/const';
import type { App, AuthOptions, GetObjectOptions, LCObject, INTERNAL_LCObject } from '../../core';

const KEY_CURRENT_USER_PROMISE = KEY_CURRENT_USER + '-promise';

export interface UpdateUserOptions extends Omit<AuthOptions, 'sessionToken'> {
  // TODO: 支持按条件更新
  query?: any;
}

export class User {
  private _object: INTERNAL_LCObject;

  constructor(object: LCObject);
  constructor(app: App, id: string);
  constructor(arg1: any, arg2?: any) {
    if (arg2) {
      this._object = (arg1 as App).database().class('_User').object(arg2) as any;
    } else {
      this._object = arg1;
    }
  }

  get app() {
    return this._object.app;
  }
  get className() {
    return this._object.className;
  }
  get id() {
    return this._object.id;
  }
  get data() {
    return this._object.data;
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

  static fromJSON(app: App, json: any): User {
    return new User(app.database().decodeObject(json, '_User'));
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
    await user.app.localStorage.setAsync(
      KEY_CURRENT_USER,
      JSON.stringify(user._object._LC_encode())
    );
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
    const { sessionToken, updatedAt } = (await this.app.request(
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
    )) as {
      objectId: string;
      sessionToken: string;
      updatedAt: string;
    };
    this._object._rawData.sessionToken = sessionToken;
    this._object._rawData.updatedAt = updatedAt;
    this.data.sessionToken = sessionToken;
    this.data.updatedAt = new Date(updatedAt);
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
    const obj = await this._object.get({ ...options, sessionToken: this.sessionToken });
    this._merge(obj as any);
    if (this.isCurrent()) {
      await User.setCurrentAsync(this);
    }
    return this;
  }

  async update(data: Record<string, any>, options?: UpdateUserOptions): Promise<this> {
    const obj = await this._object.update(data, {
      ...options,
      fetchUpdatedData: true,
      sessionToken: this.sessionToken,
    });
    this._merge(obj as any);
    if (this.isCurrent()) {
      await User.setCurrentAsync(this);
    }
    return this;
  }

  async delete(options: Omit<AuthOptions, 'sessionToken'>): Promise<void> {
    await this._object.delete({
      ...options,
      sessionToken: this.sessionToken,
    });
    if (this.isCurrent()) {
      await this.app.localStorage.removeAsync(KEY_CURRENT_USER);
    }
  }

  toJSON() {
    return this._object.toJSON();
  }

  private _merge(obj: INTERNAL_LCObject): void {
    Object.assign(this._object._rawData, obj._rawData);
    Object.assign(this.data, obj.data);
  }

  protected _LC_encode() {
    return this._object._LC_encode();
  }
}

export type UserReference = Pick<User, 'app' | 'className' | 'id' | 'get' | 'update' | 'delete'>;
