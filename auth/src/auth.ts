import type { App } from '../../core';
import { User } from './user';

const KEY_CURRENT_USER = 'currentUser';

export class Auth {
  constructor(public readonly app: App) {}

  private _decodeAndSetCurrent = (data: any): User => {
    const user = User.fromJSON(this.app, data);
    this.app.authOptions.sessionToken = user.sessionToken;
    this.app.payload[KEY_CURRENT_USER] = user;
    return user;
  };

  currentUser(): User | undefined {
    if (!this.app.payload[KEY_CURRENT_USER]) {
      const str = this.app.storage.get(KEY_CURRENT_USER);
      const data = JSON.parse(str);
      this.app.payload[KEY_CURRENT_USER] = User.fromJSON(this.app, data);
    }
    return this.app.payload[KEY_CURRENT_USER];
  }

  async currentUserAsync(): Promise<User | undefined> {
    if (!this.app.payload[KEY_CURRENT_USER]) {
      const str = await this.app.storage.getAsync(KEY_CURRENT_USER);
      const data = JSON.parse(str);
      this.app.payload[KEY_CURRENT_USER] = User.fromJSON(this.app, data);
    }
    return this.app.payload[KEY_CURRENT_USER];
  }

  login(username: string, password: string) {
    return this.app.api(
      {
        method: 'POST',
        path: '/1.1/login',
        body: { username, password },
      },
      this._decodeAndSetCurrent
    );
  }

  loginWithSessionToken(sessionToken: string) {
    const sessionTokenBefore = this.app.authOptions.sessionToken;
    this.app.authOptions.sessionToken = sessionToken;
    const task = this.app.api(
      {
        method: 'GET',
        path: '/1.1/users/me',
      },
      this._decodeAndSetCurrent
    );
    task.catch(() => (this.app.authOptions.sessionToken = sessionTokenBefore));
    return task;
  }
}
