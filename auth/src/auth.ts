import type { App } from '../../core';
import { User } from './user';

const KEY_CURRENT_USER = 'currentUser';

export function setHooks(appClass: typeof App): void {
  appClass.addHook('beforeInvokeAPI', async function (_, options) {
    if (options.user) {
      return;
    }
    const currentUser = await Auth.getCurrentUserAsync(this);
    if (currentUser) {
      options.user = currentUser;
    }
  });
}

export class Auth {
  constructor(public readonly app: App) {}

  static getCurrentUser(app: App): User | undefined {
    if (!app.payload[KEY_CURRENT_USER]) {
      const userStr = app.storage.get(KEY_CURRENT_USER);
      if (userStr) {
        const user = User.fromJSON(app, JSON.parse(userStr));
        app.payload[KEY_CURRENT_USER] = user;
      }
    }
    return app.payload[KEY_CURRENT_USER];
  }

  static async getCurrentUserAsync(app: App): Promise<User | undefined> {
    if (!app.payload[KEY_CURRENT_USER]) {
      const userStr = await app.storage.getAsync(KEY_CURRENT_USER);
      if (userStr) {
        const user = User.fromJSON(app, JSON.parse(userStr));
        app.payload[KEY_CURRENT_USER] = user;
      }
    }
    return app.payload[KEY_CURRENT_USER];
  }

  currentUser(): User | undefined {
    return Auth.getCurrentUser(this.app);
  }

  currentUserAsync(): Promise<User | undefined> {
    return Auth.getCurrentUserAsync(this.app);
  }

  login(username: string, password: string) {
    return this.app.api(
      {
        method: 'POST',
        path: '/1.1/login',
        body: { username, password },
      },
      {
        after: this._decodeAndSetCurrent,
      }
    );
  }

  loginWithSessionToken(sessionToken: string) {
    const task = this.app.api(
      {
        method: 'GET',
        path: '/1.1/users/me',
      },
      {
        user: { sessionToken },
        after: this._decodeAndSetCurrent,
      }
    );
    return task;
  }

  private _decodeAndSetCurrent = (data: any): User => {
    const user = User.fromJSON(this.app, data);
    this.app.payload[KEY_CURRENT_USER] = user;
    return user;
  };
}
