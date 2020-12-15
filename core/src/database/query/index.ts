import clone from 'lodash/clone';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';

import type { App, AuthOptions } from '../../app';
import { HTTPRequest } from '../../http';
import { LCEncode, LCObject } from '../lcobject';
import { Condition, isConstraint, isRawCondition } from './constraint';

export class LCQuery {
  protected _params: HTTPRequest['query'] = {};
  protected _condition: Condition = {};

  constructor(public readonly app: App, public readonly className: string) {}

  protected _applyConstraint(cond: Record<string, any>): Condition {
    if (!isPlainObject(cond)) {
      throw new Error('无效的查询约束');
    }

    const and: Condition[] = [];
    let tempCond: Condition = {};

    Object.entries(cond).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (!isRawCondition(tempCond)) {
        and.push(tempCond);
        tempCond = {};
      }
      if (isConstraint(value)) {
        tempCond = value.applyQueryConstraint(tempCond, key);
      } else {
        tempCond[key] = LCEncode(value);
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

  where(cond: Record<string, any>): LCQuery;
  where(cond: Record<string, any>[]): LCQuery;
  where(cond: Record<string, any> | Record<string, any>[]): LCQuery {
    if (isEmpty(cond) || (Array.isArray(cond) && cond.length === 0)) {
      return this;
    }

    const query = this.clone();

    let newCond: Condition;
    if (Array.isArray(cond)) {
      const or: Condition[] = [];
      cond.forEach((item) => {
        const tmp = query._applyConstraint(item);
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
      newCond = query._applyConstraint(cond);
    }

    if (!isEmpty(newCond)) {
      if (isEmpty(query._condition)) {
        query._condition = newCond;
      } else {
        query._condition = { $and: [query._condition, newCond] };
      }
    }

    return query;
  }

  include(keys: string[]): LCQuery;
  include(...keys: string[]): LCQuery;
  include(key: string | string[], ...rest: string[]): LCQuery {
    const query = this.clone();
    if (typeof key === 'string') {
      query._params.include = [key, ...rest].join(',');
    } else {
      query._params.include = key.join(',');
    }
    return query;
  }

  skip(count: number): LCQuery {
    const query = this.clone();
    query._params.skip = count;
    return query;
  }

  limit(count: number): LCQuery {
    const query = this.clone();
    query._params.limit = count;
    return query;
  }

  orderBy(key: string, direction: 'asc' | 'desc' = 'asc'): LCQuery {
    const query = this.clone();
    if (direction === 'desc') {
      key = '-' + key;
    }
    if (this._params.order) {
      this._params.order += ',' + key;
    } else {
      this._params.order = key;
    }
    return query;
  }

  async find(options?: AuthOptions): Promise<LCObject[]> {
    const { results = [] } = await this.app.request(
      {
        method: 'GET',
        path: `/1.1/classes/${this.className}`,
        query: {
          ...this._params,
          where: JSON.stringify(this._condition),
        },
      },
      options
    );
    return results.map((result) => LCObject.fromJSON(this.app, result, this.className));
  }

  async first(options?: AuthOptions): Promise<LCObject | null> {
    const objects = await this.limit(1).find(options);
    return objects.length ? objects[0] : null;
  }

  clone(): LCQuery {
    const query = new LCQuery(this.app, this.className);
    query._params = clone(this._params);
    query._condition = clone(this._condition);
    return query;
  }
}
