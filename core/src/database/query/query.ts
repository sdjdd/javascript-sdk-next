import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';

import type { App, AuthOptions } from '../../app';
import { HTTPRequest } from '../../http';
import { queryCommand, QueryCommand } from './command';
import { Condition, isConstraint, isRawCondition } from './constraint';

export type QueryDecoder<T = any> = (app: App, data: any, className: string) => T;

export type QueryParams = HTTPRequest['query'];

export type QueryConstraint = Record<string, any> | Record<string, any>[];

export type QueryOrder = 'asc' | 'desc';

export class Query<T> {
  private _include = new Set<string>();
  private _order = new Set<string>();
  private _skip?: number;
  private _limit?: number;
  private _condition: Condition = {};

  constructor(
    public readonly app: App,
    public readonly className: string,
    protected _decoder: QueryDecoder<T>
  ) {}

  get condition(): Condition {
    const rm$eq = (cond: Condition) => {
      if ('$and' in cond) {
        cond.$and = cond.$and.map(rm$eq);
      } else if ('$or' in cond) {
        cond.$or = cond.$or.map(rm$eq);
      } else {
        Object.entries(cond).forEach(([key, value]) => {
          if (value.$eq) {
            cond[key] = value.$eq;
          }
        });
      }
      return cond;
    };
    rm$eq(this._condition);
    return this._condition;
  }

  get params(): QueryParams {
    const params: QueryParams = {};
    if (this._include.size) {
      params.include = Array.from(this._include).join(',');
    }
    if (this._order.size) {
      params.order = Array.from(this._order).join(',');
    }
    if (this._skip !== undefined) {
      params.skip = this._skip;
    }
    if (this._limit !== undefined) {
      params.limit = this._limit;
    }
    if (!isEmpty(this._condition)) {
      params.where = this.condition;
    }
    return params;
  }

  protected _applyConstraint(cond: Record<string, any>): Condition {
    if (!isPlainObject(cond)) {
      throw new Error('无效的查询约束');
    }

    const and: Condition[] = [];
    let tempCond: Condition = this._condition;
    Object.entries(cond).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (!isConstraint(value)) {
        value = queryCommand.eq(value);
      }
      if (!isRawCondition(tempCond)) {
        and.push(tempCond);
        tempCond = {};
      }
      tempCond = value.applyQueryConstraint(tempCond, key);
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

  where<T extends keyof QueryCommand>(
    key: string,
    command: T,
    ...values: Parameters<QueryCommand[T]>
  ): this;
  where(cond: QueryConstraint): this;
  where(cond: string | QueryConstraint, command?: any, ...values: any[]): this {
    if (typeof cond === 'string') {
      if (!command) {
        throw new TypeError('查询命令不能为空');
      }
      if (!queryCommand[command]) {
        throw new TypeError(`未知的查询命令 ${command}`);
      }
      return this.where({ [cond]: queryCommand[command](...values) });
    }

    if (isEmpty(cond)) {
      return this;
    }

    if (Array.isArray(cond)) {
      const or: Condition[] = [];
      cond.forEach((item) => {
        const tempCond = this._applyConstraint(item);
        if (!isEmpty(tempCond)) {
          or.push(tempCond);
        }
      });
      if (or.length) {
        this._condition = or.length === 1 ? or[0] : { $or: or };
      }
    } else {
      this._condition = this._applyConstraint(cond);
    }
    return this;
  }

  include(keys: string[]): Query<T>;
  include(...keys: string[]): Query<T>;
  include(key: string | string[], ...rest: string[]): Query<T> {
    if (Array.isArray(key)) {
      key.forEach((k) => this._include.add(k));
    } else {
      this._include.add(key);
    }
    rest.forEach((k) => this._include.add(k));
    return this;
  }

  skip(count: number): Query<T> {
    this._skip = count;
    return this;
  }

  limit(count: number): Query<T> {
    this._limit = count;
    return this;
  }

  orderBy(key: string, order: QueryOrder = 'asc'): Query<T> {
    switch (order) {
      case 'asc':
        this._order.add(key);
        this._order.delete('-' + key);
        break;
      case 'desc':
        this._order.add('-' + key);
        this._order.delete(key);
        break;
      default:
        throw new TypeError(`未知的查询排序方式 ${order}`);
    }
    return this;
  }

  async find(options?: AuthOptions): Promise<T[]> {
    const { results = [] } = await this.app.request(
      {
        method: 'GET',
        path: `/1.1/classes/${this.className}`,
        query: this.params,
      },
      options
    );
    return results.map((result) => this._decoder(this.app, result, this.className));
  }

  async first(options?: AuthOptions): Promise<T | null> {
    const objects = await this.limit(1).find(options);
    return objects.length ? objects[0] : null;
  }
}
