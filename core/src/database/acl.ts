const ACL_ACTIONS = ['read', 'write'] as const;

export type ACLAction = typeof ACL_ACTIONS[number];

export type ACLPrivilege = Partial<Record<ACLAction, boolean>>;

export type ACLSubject = string | { id: string } | { aclKey: string };

export class ACL {
  private _privileges: Record<ACLAction, Set<string>>;

  constructor() {
    this._privileges = {} as any;
    ACL_ACTIONS.forEach((action) => (this._privileges[action] = new Set()));
  }

  static fromJSON(data: Record<string, ACLPrivilege>): ACL {
    const acl = new ACL();
    Object.entries(data).forEach(([subject, privilege]) => {
      Object.entries(privilege).forEach(([action, allowed]) => {
        if (allowed) {
          acl.allow(subject, action as ACLAction);
        }
      });
    });
    return acl;
  }

  static getSubjectKey(subject: ACLSubject): string | never {
    if (typeof subject === 'string') {
      return subject;
    }
    if ('aclKey' in subject) {
      return subject.aclKey;
    }
    if ('id' in subject) {
      return subject.id;
    }
    throw new TypeError('Invalid ACL Subject');
  }

  allow(subject: ACLSubject, action: ACLAction): this {
    this._privileges[action].add(ACL.getSubjectKey(subject));
    return this;
  }

  // 不用 deny 是因为 deny 这个词给人一种支持黑名单的感觉，实际上不支持。
  disallow(subject: ACLSubject, action: ACLAction): this {
    this._privileges[action].delete(ACL.getSubjectKey(subject));
    return this;
  }

  can(subject: ACLSubject, action: ACLAction): boolean {
    return this._privileges[action].has(ACL.getSubjectKey(subject));
  }

  toJSON(): Record<string, ACLPrivilege> {
    const json: Record<string, ACLPrivilege> = {};
    Object.entries(this._privileges).forEach(([action, subjects]) => {
      subjects.forEach((subject) => {
        if (!json[subject]) {
          json[subject] = {};
        }
        json[subject][action] = true;
      });
    });
    return json;
  }
}
