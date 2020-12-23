import { LCEncode } from '../lcobject';

export type RawCondition = Record<string, any>;

export type AndCondition = { $and: Condition[] };

export type OrCondition = { $or: Condition[] };

export type Condition = RawCondition | AndCondition | OrCondition;

export function isRawCondition(cond: Condition): cond is RawCondition {
  return !(cond as AndCondition).$and && !(cond as OrCondition).$or;
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
      throw new TypeError('不能使用 undefined 作为查询约束');
    }
    return {
      ...cond,
      [key]: encode(this.value),
    };
  }
}

export class NotEqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $ne: encode(this.value) },
    };
  }
}

export class GreaterThanConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $gt: encode(this.value) },
    };
  }
}

export class GreaterThanOrEqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $gte: encode(this.value) },
    };
  }
}

export class LessThanConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $lt: encode(this.value) },
    };
  }
}

export class LessThanOrEqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $lte: encode(this.value) },
    };
  }
}

export class ExistsConstraint implements Constraint {
  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $exists: true },
    };
  }
}

export class NotExistsConstraint implements Constraint {
  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $exists: false },
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
        or.push({
          ...cond,
          [key]: LCEncode(item, { pointer: true }),
        });
      }
    });

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
      if (isConstraint(item)) {
        and.push(item.applyQueryConstraint(cond, key));
      } else {
        and.push({
          ...cond,
          [key]: LCEncode(item, { pointer: true }),
        });
      }
    });

    return and.length === 1 ? and[0] : { $and: and };
  }
}

export class InConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: RawCondition, key: string): Condition {
    return {
      ...cond,
      [key]: { $in: encode(this.value) },
    };
  }
}
