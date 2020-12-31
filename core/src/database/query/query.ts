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

export type ForEachCallback<T> = (object: T, index: number) => void | Promise<void>;

export class Query<T> {
  private _order = new Set<string>();
  private _include = new Set<string>();
  private _keys = new Set<string>();
  private _condition: Condition = {};
  private _skip?: number;
  private _limit?: number;
  private _returnACL?: boolean;

  constructor(
    public readonly app: App,
    public readonly className: string,
    protected _decoder: QueryDecoder<T>
  ) {}

  get condition(): Condition | undefined {
    if (isEmpty(this._condition)) {
      return undefined;
    }
    return rm$eq(this._condition);
  }

  get params(): QueryParams {
    const params: QueryParams = {
      where: this.condition,
      skip: this._skip,
      limit: this._limit,
    };
    if (this._order.size) {
      params.order = Array.from(this._order).join(',');
    }
    if (this._include.size) {
      params.include = Array.from(this._include).join(',');
    }
    if (this._keys.size) {
      params.keys = Array.from(this._keys).join(',');
    }
    if (this._returnACL) {
      params.returnACL = true;
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

  select(keys: string[]): this;
  select(...keys: string[]): this;
  select(key: string | string[], ...rest: string[]): this {
    if (Array.isArray(key)) {
      key.forEach((k) => this._keys.add(k));
    } else {
      this._keys.add(key);
    }
    rest.forEach((k) => this._keys.add(k));
    return this;
  }

  include(keys: string[]): this;
  include(...keys: string[]): this;
  include(key: string | string[], ...rest: string[]): this {
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

  returnACL(enable: boolean): this {
    this._returnACL = enable;
    return this;
  }

  decodeObject(data: any): T {
    return this._decoder(this.app, data, this.className);
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

  async forEach(
    callback: ForEachCallback<T>,
    options?: Omit<AuthOptions, 'useMasterKey'>
  ): Promise<void> {
    // TODO: 在未设置 masterKey 时提示使用者
    const authOptions: AuthOptions = { ...options, useMasterKey: true };

    let index = 0;
    let cursor: string;
    while (cursor !== null) {
      const { results = [], cursor: newCursor = null } = (await this.app.request(
        {
          method: 'GET',
          path: `/1.1/scan/classes/${this.className}`,
          query: {
            cursor,
            limit: this._limit,
            where: this.condition,
          },
        },
        authOptions
      )) as { results: Record<string, any>[]; cursor: string | null };
      cursor = newCursor;

      await Promise.all(results.map((data) => callback(this.decodeObject(data), index++)));
    }
  }
}

function rm$eq(cond: Condition) {
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
}
