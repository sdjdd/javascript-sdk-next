export type RawCondition = Record<string, any>;

export type AndCondition = { $and: Condition[] };

export type OrCondition = { $or: Condition[] };

export type Condition = RawCondition | AndCondition | OrCondition;

export function isRawCondition(cond: Condition): cond is RawCondition {
  return !(cond as AndCondition).$and && !(cond as OrCondition).$or;
}

export interface Constraint<T = any> {
  value: T;
  applyQueryConstraint(condition: RawCondition, key: string): Condition;
}

export function isConstraint(value: any): value is Constraint {
  return value && typeof value.applyQueryConstraint === 'function';
}

export class EqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      throw new TypeError('不能使用 undefined 作为查询约束');
    }
    return {
      ...cond,
      [key]: this.value,
    };
  }
}

export class NotEqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      throw new TypeError('不能使用 undefined 作为查询约束');
    }
    return {
      ...cond,
      [key]: { $ne: this.value },
    };
  }
}

export class OrConstraint implements Constraint<Constraint[]> {
  constructor(public readonly value: Constraint[]) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (!this.value || this.value.length === 0) {
      return cond;
    }
    if (this.value.length === 1) {
      return this.value[0].applyQueryConstraint(cond, key);
    }
    return {
      $or: this.value.map((item) => item.applyQueryConstraint(cond, key)),
    };
  }
}
