import clone from 'lodash/clone';
import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';

import type { App, AuthOptions } from '../../app';
import { HTTPRequest } from '../../http';
import { LCEncode } from '../lcobject';
import { Condition, isConstraint, isRawCondition } from './constraint';

export type QueryDecoder<T = any> = (app: App, data: any, className: string) => T;

export type QueryParams = HTTPRequest['query'];

export class Query<T> {
  params: QueryParams = {};

  private _condition: Condition = {};

  constructor(
    public readonly app: App,
    public readonly className: string,
    protected _decoder: QueryDecoder<T>
  ) {}

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
        tempCond[key] = LCEncode(value, { pointer: true });
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

  decodeWith<T>(decoder: QueryDecoder<T>): Query<T> {
    const query: Query<T> = this.clone() as any;
    query._decoder = decoder;
    return query;
  }

  where(cond: Record<string, any>): Query<T>;
  where(cond: Record<string, any>[]): Query<T>;
  where(cond: Record<string, any> | Record<string, any>[]): Query<T> {
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

  include(keys: string[]): Query<T>;
  include(...keys: string[]): Query<T>;
  include(key: string | string[], ...rest: string[]): Query<T> {
    const query = this.clone();
    const include = typeof key === 'string' ? [key, ...rest] : key;
    if (query.params.include) {
      query.params.include += ',' + include.join(',');
    } else {
      query.params.include = include.join(',');
    }
    return query;
  }

  skip(count: number): Query<T> {
    const query = this.clone();
    query.params.skip = count;
    return query;
  }

  limit(count: number): Query<T> {
    const query = this.clone();
    query.params.limit = count;
    return query;
  }

  orderBy(key: string, direction: 'asc' | 'desc' = 'asc'): Query<T> {
    const query = this.clone();
    if (direction === 'desc') {
      key = '-' + key;
    }
    if (this.params.order) {
      this.params.order += ',' + key;
    } else {
      this.params.order = key;
    }
    return query;
  }

  async find(options?: AuthOptions): Promise<T[]> {
    const { results = [] } = await this.app.request(
      {
        method: 'GET',
        path: `/1.1/classes/${this.className}`,
        query: {
          ...this.params,
          where: isEmpty(this._condition) ? undefined : JSON.stringify(this._condition),
        },
      },
      options
    );
    return results.map((result) => this._decoder(this.app, result, this.className));
  }

  async first(options?: AuthOptions): Promise<T | null> {
    const objects = await this.limit(1).find(options);
    return objects.length ? objects[0] : null;
  }

  clone(): Query<T> {
    const query = new Query<T>(this.app, this.className, this._decoder);
    query.params = clone(this.params);
    query._condition = clone(this._condition);
    query._decoder = this._decoder;
    return query;
  }
}
