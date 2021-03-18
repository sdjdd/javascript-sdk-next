import { KEY_CURRENT_USER } from '../../common/const';
import type {
  App,
  AuthOptions,
  DeleteObjectOptions,
  EncodeOptions,
  GetObjectOptions,
  LCObject,
  UpdateObjectOptions,
} from '../../core';

export type UpdateUserOptions = Omit<UpdateObjectOptions, 'sessionToken'>;

// TODO: 实现 UserReference
export class User {
  constructor(private _object: LCObject) {}

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

  static getCurrent(app: App, cachedOnly = false): User | null {
    if (KEY_CURRENT_USER in app.payload) {
      return app.payload[KEY_CURRENT_USER];
    }
    if (cachedOnly) {
      return null;
    }
    const user_str = app.localStorage.get(KEY_CURRENT_USER);
    app.payload[KEY_CURRENT_USER] = user_str ? User.fromJSON(app, JSON.parse(user_str)) : null;
    return app.payload[KEY_CURRENT_USER];
  }

  static async getCurrentAsync(app: App): Promise<User | null> {
    if (KEY_CURRENT_USER in app.payload) {
      return app.payload[KEY_CURRENT_USER];
    }
    const user_str = await app.localStorage.getAsync(KEY_CURRENT_USER);
    app.payload[KEY_CURRENT_USER] = user_str ? User.fromJSON(app, JSON.parse(user_str)) : null;
    return await app.payload[KEY_CURRENT_USER];
  }

  static async setCurrentAsync(user: User): Promise<void> {
    user.app.payload[KEY_CURRENT_USER] = user;
    await user.app.localStorage.setAsync(
      KEY_CURRENT_USER,
      // @ts-ignore
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
    // @ts-ignore
    this._object._rawData.sessionToken = sessionToken;
    // @ts-ignore
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

  async update(
    data: Record<string, any>,
    options?: Omit<UpdateUserOptions, 'fetchUpdatedData'>
  ): Promise<this> {
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

  async delete(options: Omit<DeleteObjectOptions, 'sessionToken'>): Promise<void> {
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

  private _merge(obj: LCObject): void {
    // @ts-ignore
    Object.assign(this._object._rawData, obj._rawData);
    Object.assign(this.data, obj.data);
  }

  protected _LC_encode(options?: EncodeOptions) {
    // @ts-ignore
    return this._object._LC_encode(options);
  }

  protected _isLCObject = true;
}

export type UserReference = Pick<User, 'app' | 'className' | 'id' | 'get' | 'update' | 'delete'>;
