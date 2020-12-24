import { ensureArray, pointer } from '../../utils';
import type { App, AuthOptions, EncodeOptions, LCObject, Query } from '../../core';
import { User } from './user';

interface RoleSubject {
  className: string;
  id: string;
}

export class Role {
  rawData: Record<string, any>;
  data: Record<string, any>;

  get className(): '_Role' {
    return '_Role';
  }
  get name(): string {
    return this.data.name;
  }
  get ACLKey(): string {
    return `role:${this.name}`;
  }

  constructor(public readonly app: App, public readonly id: string) {}

  static fromLCObject(object: LCObject): Role {
    const role = new Role(object.app, object.id);
    role.rawData = object.rawData;
    role.data = object.data;
    return role;
  }

  static fromJSON(app: App, data: any): Role {
    return Role.fromLCObject(app.database().decodeObject(data, '_Role'));
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

  queryUsers(): Query<User> {
    return this.app
      .database()
      .class('_User')
      .decodeWith(User.fromJSON)
      .where({
        $relatedTo: {
          key: 'users',
          object: this,
        },
      });
  }

  queryRoles(): Query<Role> {
    return this.app
      .database()
      .class('_Role')
      .decodeWith(Role.fromJSON)
      .where({
        $relatedTo: {
          key: 'roles',
          object: this,
        },
      });
  }

  getUsers(options?: AuthOptions): Promise<User[]> {
    return this.queryUsers().find(options);
  }

  getRoles(options?: AuthOptions): Promise<Role[]> {
    return this.queryRoles().find(options);
  }

  toJSON(options?: EncodeOptions): Record<string, any> {
    if (options?.pointer) {
      return pointer(this);
    } else {
      return {
        ...this.rawData,
        __type: 'Object',
        className: this.className,
        objectId: this.id,
      };
    }
  }
}
