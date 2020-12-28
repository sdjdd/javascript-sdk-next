import isEmpty from 'lodash/isEmpty';
import { LCEncode } from '../lcobject';

export type RawCondition = Record<string, any>;

export type AndCondition = { $and: Condition[] };

export type OrCondition = { $or: Condition[] };

export type Condition = RawCondition | AndCondition | OrCondition;

export function isAndCondition(cond: Condition): cond is AndCondition {
  return !!(cond as AndCondition).$and;
}

export function isOrCondition(cond: Condition): cond is OrCondition {
  return !!(cond as OrCondition).$or;
}

export function isRawCondition(cond: Condition): cond is RawCondition {
  return !isOrCondition(cond) && !isAndCondition(cond);
}

export interface Constraint<T = any> {
  value?: T;
  applyQueryConstraint(condition: RawCondition, key: string): Condition;
}

export function isConstraint(value: any): value is Constraint {
  return value && typeof value.applyQueryConstraint === 'function';
}

function encode(value: any): any {
  return LCEncode(value, { pointer: true });
}

export class EqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      throw new TypeError('不支持使用 undefined 作为相等约束的比较值');
    }
    return {
      ...cond,
      [key]: { ...cond[key], $eq: encode(this.value) },
    };
  }
}

export class NotEqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      return cond;
    }
    return {
      ...cond,
      [key]: { ...cond[key], $ne: encode(this.value) },
    };
  }
}

export class GreaterThanConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      return cond;
    }
    return {
      ...cond,
      [key]: { ...cond[key], $gt: encode(this.value) },
    };
  }
}

export class GreaterThanOrEqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      return cond;
    }
    return {
      ...cond,
      [key]: { ...cond[key], $gte: encode(this.value) },
    };
  }
}

export class LessThanConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      return cond;
    }
    return {
      ...cond,
      [key]: { ...cond[key], $lt: encode(this.value) },
    };
  }
}

export class LessThanOrEqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (this.value === undefined) {
      return cond;
    }
    return {
      ...cond,
      [key]: { ...cond[key], $lte: encode(this.value) },
    };
  }
}

export class ExistsConstraint implements Constraint {
  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $exists: true },
    };
  }
}

export class NotExistsConstraint implements Constraint {
  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $exists: false },
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
      if (!isConstraint(item)) {
        item = new EqualConstraint(item);
      }
      const tempCond = item.applyQueryConstraint(cond, key);
      if (!isEmpty(tempCond)) {
        or.push(tempCond);
      }
    });
    if (or.length === 0) {
      return cond;
    }
    return or.length === 1 ? or[0] : { $or: or };
  }
}

export class AndConstraint implements Constraint<any[]> {
  constructor(public readonly value: any[]) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    if (!this.value || this.value.length === 0) {
      return cond;
    }

    const and: Condition[] = [];
    this.value.forEach((item) => {
      if (!isConstraint(item)) {
        item = new EqualConstraint(item);
      }
      const tempCond = item.applyQueryConstraint(cond, key);
      if (isEmpty(tempCond)) {
        and.push(tempCond);
      }
    });
    if (and.length === 0) {
      return cond;
    }
    return and.length === 1 ? and[0] : { $and: and };
  }
}

export class InConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $in: encode(this.value) },
    };
  }
}
