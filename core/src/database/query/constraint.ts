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

export class OrConstraint implements Constraint<any[]> {
  constructor(public readonly value: any[]) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (!this.value || this.value.length === 0) {
      return cond;
    }
    const or: Condition[] = [];

    this.value.forEach((item) => {
      if (isConstraint(item)) {
        or.push(item.applyQueryConstraint(cond, key));
      } else {
        or.push({ ...cond, [key]: item });
      }
    });

    return or.length === 1 ? or[0] : { $or: or };
  }
}
