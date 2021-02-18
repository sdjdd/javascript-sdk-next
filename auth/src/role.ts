import { ensureArray } from '../../common/utils';
import type {
  App,
  AuthOptions,
  DeleteObjectOptions,
  EncodeOptions,
  GetObjectOptions,
  INTERNAL_LCObject,
  INTERNAL_LCObjectReference,
  Query,
  UpdateObjectOptions,
} from '../../core';
import { User } from './user';

interface RoleSubject {
  className: string;
  id: string;
}

export class RoleReference {
  private _ref: INTERNAL_LCObjectReference<Role>;

  constructor(app: App, id: string) {
    this._ref = app.database().class('_Role', Role.fromJSON).object(id) as any;
  }

  get app() {
    return this._ref.app;
  }
  get className() {
    return this._ref.className;
  }
  get id() {
    return this._ref.id;
  }

  add(subject: RoleSubject | RoleSubject[], options?: AuthOptions): Promise<void> {
    const users: RoleSubject[] = [];
    const roles: RoleSubject[] = [];
    ensureArray(subject).forEach((sub) => {
      switch (sub.className) {
        case '_User':
          users.push(sub);
          break;
        case '_Role':
          users.push(sub);
          break;
        default:
          throw new TypeError('仅能向角色中添加用户或另一角色');
      }
    });

    const { addRelation } = this.app.database().op;
    return this.app.request(
      {
        method: 'PUT',
        path: `/1.1/roles/${this.id}`,
        body: {
          users: users.length ? addRelation(users) : undefined,
          roles: roles.length ? addRelation(roles) : undefined,
        },
      },
      options
    );
  }

  remove(subject: RoleSubject | RoleSubject[], options?: AuthOptions): Promise<void> {
    const users: RoleSubject[] = [];
    const roles: RoleSubject[] = [];
    ensureArray(subject).forEach((sub) => {
      switch (sub.className) {
        case '_User':
          users.push(sub);
          break;
        case '_Role':
          users.push(sub);
          break;
        default:
          throw new TypeError('仅能从角色中移除用户或另一角色');
      }
    });

    const { removeRelation } = this.app.database().op;
    return this.app.request(
      {
        method: 'PUT',
        path: `/1.1/roles/${this.id}`,
        body: {
          users: users.length ? removeRelation(users) : undefined,
          roles: roles.length ? removeRelation(roles) : undefined,
        },
      },
      options
    );
  }

  queryUser(): Query<User> {
    return this.app
      .database()
      .class('_User', User.fromJSON)
      .where({
        $relatedTo: {
          key: 'users',
          object: this,
        },
      });
  }

  queryRole(): Query<Role> {
    return this.app
      .database()
      .class('_Role', Role.fromJSON)
      .where({
        $relatedTo: {
          key: 'roles',
          object: this,
        },
      });
  }

  getUsers(options?: AuthOptions): Promise<User[]> {
    return this.queryUser().find(options);
  }

  getRoles(options?: AuthOptions): Promise<Role[]> {
    return this.queryRole().find(options);
  }

  get(options?: GetObjectOptions): Promise<Role> {
    return this._ref.get(options);
  }

  update(data: Record<string, any>, options?: UpdateObjectOptions): Promise<Role> {
    return this._ref.update(data, options);
  }

  delete(options?: DeleteObjectOptions): Promise<void> {
    return this._ref.delete(options);
  }

  toJSON() {
    return this._LC_encode();
  }

  protected _LC_encode() {
    return this._ref._LC_encode();
  }
}

export class Role {
  private _ref: RoleReference;
  private _object: INTERNAL_LCObject;

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

  get name(): string {
    return this.data.name;
  }
  get ACLKey(): string {
    return `role:${this.name}`;
  }

  static fromJSON(app: App, data: any): Role {
    const role = new Role();
    role._object = app.database().decodeObject(data, '_Role') as any;
    role._ref = new RoleReference(app, role.id);
    return role;
  }

  add(subject: RoleSubject | RoleSubject[], options?: AuthOptions): Promise<void> {
    return this._ref.add(subject, options);
  }

  remove(subject: RoleSubject | RoleSubject[], options?: AuthOptions): Promise<void> {
    return this._ref.remove(subject, options);
  }

  queryUser(): Query<User> {
    return this._ref.queryUser();
  }

  queryRole(): Query<Role> {
    return this._ref.queryRole();
  }

  getUsers(options?: AuthOptions): Promise<User[]> {
    return this._ref.getUsers(options);
  }

  getRoles(options?: AuthOptions): Promise<Role[]> {
    return this._ref.getRoles(options);
  }

  get(options?: GetObjectOptions): Promise<Role> {
    return this._ref.get(options);
  }

  update(data: Record<string, any>, options?: UpdateObjectOptions): Promise<Role> {
    return this._ref.update(data, options);
  }

  delete(options?: DeleteObjectOptions): Promise<void> {
    return this._ref.delete(options);
  }

  toJSON() {
    return this._object.toJSON();
  }

  protected _LC_encode(options?: EncodeOptions) {
    return this._object._LC_encode(options);
  }
}
