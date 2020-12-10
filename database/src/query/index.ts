import { isEmpty, isPlainObject } from 'lodash';

import type { App } from '../../../core/src';
import { orCommand } from './command';
import { Condition, Constraint, isConstraint, isRawCondition } from './constraint';

export class LCQuery {
  protected _condition: Condition = {};

  constructor(public readonly app: App, public readonly className: string) {}

  protected _applyCondition(cond: Condition): Condition {
    const and: Condition[] = [];
    let tempCond: Condition = {};
    Object.entries(flat(cond)).forEach(([key, value]) => {
      // array 等同于 OrConstraint
      if (Array.isArray(value)) {
        value = orCommand(value);
      }

      if (!isConstraint(value)) {
        throw new Error('无效的查询约束，key=' + key);
      }

      tempCond = value.applyQueryConstraint(tempCond, key);
      if (!isRawCondition(tempCond)) {
        and.push(tempCond);
        tempCond = {};
      }
    });
    if (isEmpty(tempCond)) {
      if (and.length) {
        return { $and: and };
      } else {
        return {};
      }
    } else {
      if (and.length) {
        and.push(tempCond);
        return { $and: and };
      } else {
        return tempCond;
      }
    }
  }

  where(cond: Record<string, Constraint>): LCQuery;
  where(cond: Record<string, Constraint>[]): LCQuery;
  where(cond: Record<string, Constraint> | Record<string, Constraint>[]): LCQuery {
    if (!cond || (Array.isArray(cond) && cond.length === 0)) {
      return this;
    }
    let newCond: Condition;
    if (Array.isArray(cond)) {
      const or: Condition[] = [];
      cond.forEach((item) => {
        if (!isPlainObject(item)) {
          throw new Error('无效的查询条件');
        }
        const tmp = this._applyCondition(item);
        if (!isEmpty(tmp)) {
          or.push(tmp);
        }
      });
      if (or.length === 1) {
        newCond = or[0];
      } else {
        newCond = { $or: or };
      }
    } else {
      newCond = this._applyCondition(cond);
    }

    if (!isEmpty(newCond)) {
      if (isEmpty(this._condition)) {
        this._condition = newCond;
      } else {
        this._condition = { $and: [this._condition, newCond] };
      }
    }

    return this;
  }
}

function flat(obj: Record<string, any>): Record<string, any> {
  const ret: Record<string, any> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (isPlainObject(value)) {
      value = flat(value);
      Object.entries(value).forEach(([innerKey, value]) => {
        ret[`${key}.${innerKey}`] = value;
      });
    } else {
      ret[key] = value;
    }
  });
  return ret;
}
