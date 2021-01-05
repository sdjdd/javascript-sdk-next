import isEmpty from 'lodash/isEmpty';

import { GeoPoint, GeoPointLike, geoPoint } from '../../../../common/types';
import { LCEncode } from '../lcobject';

export interface Condition extends Record<string, any> {
  $and?: Condition[];
  $or?: Condition[];
}

export function isAndCondition(cond: Condition): cond is Condition & { $and: Condition[] } {
  return cond && '$and' in cond;
}

export function isOrCondition(cond: Condition): cond is Condition & { $or: Condition[] } {
  return cond && '$or' in cond;
}

export function isRawCondition(cond: Condition): boolean {
  return !isOrCondition(cond) && !isAndCondition(cond);
}

export interface Constraint<T = any> {
  value?: T;
  applyQueryConstraint(condition: Condition, key: string): Condition;
}

export function isConstraint(value: any): value is Constraint {
  return value && typeof value.applyQueryConstraint === 'function';
}

function encode(value: any): any {
  return LCEncode(value, { pointer: true });
}

export class EqualConstraint implements Constraint {
  constructor(public readonly value: any) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
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

  applyQueryConstraint(cond: Condition, key: string): Condition {
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

  applyQueryConstraint(cond: Condition, key: string): Condition {
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

  applyQueryConstraint(cond: Condition, key: string): Condition {
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

  applyQueryConstraint(cond: Condition, key: string): Condition {
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

  applyQueryConstraint(cond: Condition, key: string): Condition {
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
  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $exists: true },
    };
  }
}

export class NotExistsConstraint implements Constraint {
  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $exists: false },
    };
  }
}

export class SizeEqualConstraint implements Constraint {
  constructor(public readonly size: number) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $size: this.size },
    };
  }
}

export class MatchesKeyConstraint implements Constraint {
  constructor(
    public readonly className: string,
    public readonly key: string, // query key
    public readonly condition?: Condition
  ) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: {
        ...cond[key],
        $select: {
          key: this.key,
          query: {
            className: this.className,
            where: this.condition,
          },
        },
      },
    };
  }
}

export class NotMatchesKeyConstraint implements Constraint {
  constructor(
    public readonly className: string,
    public readonly key: string, // query key
    public readonly condition?: Condition
  ) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: {
        ...cond[key],
        $dontSelect: {
          key: this.key,
          query: {
            className: this.className,
            where: this.condition,
          },
        },
      },
    };
  }
}

export class MatchesQueryConstraint implements Constraint {
  constructor(public readonly className: string, public readonly condition?: Condition) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: {
        ...cond[key],
        $inQuery: {
          className: this.className,
          where: this.condition,
        },
      },
    };
  }
}

export class NotMatchesQueryConstraint implements Constraint {
  constructor(public readonly className: string, public readonly condition?: Condition) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: {
        ...cond[key],
        $notInQuery: {
          className: this.className,
          where: this.condition,
        },
      },
    };
  }
}

export interface RegExpLike {
  source: string;
  ignoreCase?: boolean;
  ignoreBlank?: boolean;
  multiline?: boolean;
  dotAll?: boolean;
}
export class MatchesConstraint implements Constraint {
  private _regexp: string;
  private _flags = '';

  constructor(regexp: string | RegExpLike) {
    if (typeof regexp === 'string') {
      this._regexp = regexp;
    } else {
      this._regexp = regexp.source;
      if (regexp.ignoreCase) {
        this._flags += 'i';
      }
      if (regexp.multiline) {
        this._flags += 'm';
      }
      if (regexp.ignoreBlank) {
        this._flags += 'x';
      }
      if (regexp.dotAll) {
        this._flags += 's';
      }
    }
  }

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: {
        ...cond[key],
        $regex: this._regexp,
        $options: this._flags || undefined,
      },
    };
  }
}

export class InConstraint implements Constraint {
  constructor(public readonly value: any[]) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $in: encode(this.value) },
    };
  }
}

export class NotInConstraint implements Constraint {
  constructor(public readonly value: any[]) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $nin: encode(this.value) },
    };
  }
}

export class ContainsAllConstraint implements Constraint {
  private _value: any[];

  constructor(value: any[]) {
    this._value = encode(value);
  }

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $all: this._value },
    };
  }
}

export class NearConstraint implements Constraint {
  private _geoPoint: GeoPoint;

  constructor(geo: GeoPointLike) {
    this._geoPoint = geoPoint(geo);
  }

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $nearSphere: this._geoPoint },
    };
  }
}

export class NearWithinMilesConstraint extends NearConstraint implements Constraint {
  private _maxDistance: number;
  private _minDistance?: number;

  constructor(geo: GeoPointLike, maxDistance: number, minDistance?: number) {
    super(geo);
    this._maxDistance = maxDistance;
    this._minDistance = minDistance;
  }

  applyQueryConstraint(cond: Condition, key: string): Condition {
    const condition = super.applyQueryConstraint(cond, key);
    condition[key].$maxDistanceInMiles = this._maxDistance;
    condition[key].$minDistanceInMiles = this._minDistance;
    return condition;
  }
}

export class NearWithinKilometersConstraint extends NearConstraint implements Constraint {
  private _maxDistance: number;
  private _minDistance?: number;

  constructor(geo: GeoPointLike, maxDistance: number, minDistance?: number) {
    super(geo);
    this._maxDistance = maxDistance;
    this._minDistance = minDistance;
  }

  applyQueryConstraint(cond: Condition, key: string): Condition {
    const condition = super.applyQueryConstraint(cond, key);
    condition[key].$maxDistanceInKilometers = this._maxDistance;
    condition[key].$minDistanceInKilometers = this._minDistance;
    return condition;
  }
}

export class NearWithinRadiansConstraint extends NearConstraint implements Constraint {
  private _maxDistance: number;
  private _minDistance?: number;

  constructor(geo: GeoPointLike, maxDistance: number, minDistance?: number) {
    super(geo);
    this._maxDistance = maxDistance;
    this._minDistance = minDistance;
  }

  applyQueryConstraint(cond: Condition, key: string): Condition {
    const condition = super.applyQueryConstraint(cond, key);
    condition[key].$maxDistanceInRadians = this._maxDistance;
    condition[key].$minDistanceInRadians = this._minDistance;
    return condition;
  }
}

export class WithinBoxConstraint implements Constraint {
  private _box: [GeoPoint, GeoPoint];

  constructor(southwest: GeoPointLike, northeast: GeoPointLike) {
    this._box = [geoPoint(southwest), geoPoint(northeast)];
  }

  applyQueryConstraint(cond: Condition, key: string): Condition {
    return {
      ...cond,
      [key]: { ...cond[key], $within: { $box: this._box } },
    };
  }
}

export class OrConstraint implements Constraint<any[]> {
  constructor(public readonly value: any[]) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    if (!this.value || this.value.length === 0) {
      return cond;
    }

    const or: Condition[] = [];
    this.value.forEach((item) => {
      if (!isConstraint(item)) {
        item = new EqualConstraint(item);
      }
      or.push(item.applyQueryConstraint({}, key));
    });
    const newCond = or.length === 1 ? or[0] : { $or: or };

    if (isEmpty(cond)) {
      return newCond;
    }
    if (isAndCondition(cond)) {
      return { ...cond, $and: [...cond.$and, newCond] };
    }
    return { $and: [cond, newCond] };
  }
}

export class AndConstraint implements Constraint<any[]> {
  constructor(public readonly value: any[]) {}

  applyQueryConstraint(cond: Condition, key: string): Condition {
    if (!this.value || this.value.length === 0) {
      return cond;
    }

    const and: Condition[] = [];
    this.value.forEach((item) => {
      if (!isConstraint(item)) {
        item = new EqualConstraint(item);
      }
      and.push(item.applyQueryConstraint({}, key));
    });
    const newCond = and.length === 1 ? and[0] : { $and: and };

    if (isEmpty(cond)) {
      return newCond;
    }
    if (isAndCondition(cond)) {
      return { ...cond, $and: [...cond.$and, newCond] };
    }
    return { $and: [cond, newCond] };
  }
}
