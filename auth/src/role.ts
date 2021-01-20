import { ensureArray } from '../../common/utils';
import type {
  App,
  AuthOptions,
  EncodeOptions,
  GetObjectOptions,
  INTERNAL_LCObject,
  LCObject,
  Query,
  UpdateObjectOptions,
} from '../../core';
import { User } from './user';

interface RoleSubject {
  className: string;
  id: string;
}

export class Role {
  private _object: INTERNAL_LCObject;

  constructor(object: LCObject);
  constructor(app: App, id: string);
  constructor(arg1: any, arg2?: any) {
    if (arg2) {
      this._object = (arg1 as App).database().class('_Role').object(arg2) as any;
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

  get name(): string {
    return this.data.name;
  }
  get ACLKey(): string {
    return `role:${this.name}`;
  }

  static fromJSON(app: App, data: any): Role {
    return new Role(app.database().decodeObject(data, '_Role'));
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

  async get(options?: GetObjectOptions): Promise<Role> {
    return new Role(await this._object.get(options));
  }

  async update(data: Record<string, any>, options?: UpdateObjectOptions): Promise<Role> {
    return new Role(await this._object.update(data, options));
  }

  delete(options?: AuthOptions): Promise<void> {
    return this.app.database().class(this.className).object(this.id).delete(options);
  }

  toJSON() {
    return this._object.toJSON();
  }

  protected _LC_encode(options?: EncodeOptions) {
    return this._object._LC_encode(options);
  }
}

export type RoleReference = Pick<
  Role,
  | 'app'
  | 'className'
  | 'id'
  | 'get'
  | 'update'
  | 'delete'
  | 'add'
  | 'remove'
  | 'queryRole'
  | 'queryUser'
  | 'getRoles'
  | 'getUsers'
>;
