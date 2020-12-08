import type { App } from '../../core';

export class User {
  id: string;
  username: string;
  email?: string;
  emailVerified: boolean;
  mobilePhoneNumber?: number;
  mobilePhoneVerified: boolean;
  sessionToken: string;
  authData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  rawData: Record<string, any>;

  constructor(public readonly app: App) {}

  static fromJSON(app: App, json: any): User {
    const user = new User(app);
    user.rawData = json;
    user.id = json.objectId;
    user.username = json.username;
    user.email = json.email;
    user.emailVerified = json.emailVerified;
    user.mobilePhoneNumber = json.mobilePhoneNumber;
    user.mobilePhoneVerified = json.mobilePhoneVerified;
    user.sessionToken = json.sessionToken;
    user.authData = json.authData;
    user.createdAt = new Date(json.createdAt);
    user.updatedAt = new Date(json.updatedAt);
    return user;
  }
}
