import isEmpty from 'lodash/isEmpty';
import isPlainObject from 'lodash/isPlainObject';

import type { App, AuthOptions } from '../../app';
import { LCObjectDecoder } from '../lcobject';
import { queryCommand, QueryCommand } from './command';
import { Condition, isConstraint } from './constraint';

export interface QueryParams {
  order?: string;
  include?: string;
  keys?: string;
  returnACL?: boolean;
  where?: Condition;
  skip?: number;
  limit?: number;
}

export type QueryConstraint = Record<string, any>;

export type QueryOrder = 'asc' | 'desc';

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
    protected _decoder: LCObjectDecoder<T>
  ) {}

  get params(): QueryParams {
    const params: QueryParams = {};
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
    if (!isEmpty(this._condition)) {
      params.where = this._condition;
    }
    if (this._skip !== undefined) {
      params.skip = this._skip;
    }
    if (this._limit !== undefined) {
      params.limit = this._limit;
    }
    return params;
  }

  protected _applyConstraint(cond: Record<string, any>): Condition {
    if (!isPlainObject(cond)) {
      throw new Error('无效的查询约束');
    }

    let tempCond = this._condition;
    Object.entries(cond).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      if (!isConstraint(value)) {
        value = queryCommand.eq(value);
      }
      tempCond = value.applyQueryConstraint(tempCond, key);
    });
    return tempCond;
  }

  clone(): Query<T> {
    const query = new Query<T>(this.app, this.className, this._decoder);
    query._order = new Set(this._order);
    query._include = new Set(this._include);
    query._keys = new Set(this._keys);
    query._condition = this._condition;
    query._skip = this._skip;
    query._limit = this._limit;
    query._returnACL = this._returnACL;
    return query;
  }

  where<N extends keyof QueryCommand>(
    key: string,
    command: N,
    ...values: Parameters<QueryCommand[N]>
  ): Query<T>;
  where(cond: QueryConstraint | QueryConstraint[]): Query<T>;
  where(
    cond: string | QueryConstraint | QueryConstraint[],
    command?: any,
    ...values: any[]
  ): Query<T> {
    const query = this.clone();

    if (typeof cond === 'string') {
      if (!command) {
        throw new TypeError('查询命令不能为空');
      }
      if (!queryCommand[command]) {
        throw new TypeError(`未知的查询命令 ${command}`);
      }
      return query.where({ [cond]: queryCommand[command](...values) });
    }

    if (isEmpty(cond)) {
      return query;
    }

    if (Array.isArray(cond)) {
      const or: Condition[] = [];
      cond.forEach((item) => {
        const tempCond = query._applyConstraint(item);
        if (!isEmpty(tempCond)) {
          or.push(tempCond);
        }
      });
      if (or.length) {
        query._condition = or.length === 1 ? or[0] : { $or: or };
      }
    } else {
      query._condition = query._applyConstraint(cond);
    }
    return query;
  }

  select(keys: string[]): Query<T>;
  select(...keys: string[]): Query<T>;
  select(key: string | string[], ...rest: string[]): Query<T> {
    const query = this.clone();
    rest.concat(key).forEach((k) => query._keys.add(k));
    return query;
  }

  include(keys: string[]): Query<T>;
  include(...keys: string[]): Query<T>;
  include(key: string | string[], ...rest: string[]): Query<T> {
    const query = this.clone();
    rest.concat(key).forEach((k) => query._include.add(k));
    return query;
  }

  skip(count: number): Query<T> {
    const query = this.clone();
    query._skip = count;
    return query;
  }

  limit(count: number): Query<T> {
    const query = this.clone();
    query._limit = count;
    return query;
  }

  orderBy(key: string, order: QueryOrder = 'asc'): Query<T> {
    const query = this.clone();
    switch (order) {
      case 'asc':
        query._order.add(key).delete('-' + key);
        break;
      case 'desc':
        query._order.add('-' + key).delete(key);
        break;
      default:
        throw new TypeError(`未知的查询排序方式 ${order}`);
    }
    return query;
  }

  returnACL(enable: boolean): Query<T> {
    const query = this.clone();
    query._returnACL = enable;
    return query;
  }

  decodeObject(data: any): T {
    return this._decoder(this.app, data, this.className);
  }

  async find(options?: AuthOptions): Promise<T[]> {
    const { results = [] } = (await this.app.request(
      {
        method: 'GET',
        path: `/1.1/classes/${this.className}`,
        query: this.params,
      },
      options
    )) as { results: Record<string, any>[] };
    return results.map((result) => this._decoder(this.app, result, this.className));
  }

  async first(options?: AuthOptions): Promise<T | null> {
    const objects = await this.limit(1).find(options);
    return objects.length ? objects[0] : null;
  }

  async count(options?: AuthOptions): Promise<number> {
    const { count = 0 } = (await this.app.request(
      {
        method: 'GET',
        path: `/1.1/classes/${this.className}`,
        query: { ...this.params, limit: 0, count: 1 },
      },
      options
    )) as { count: number };
    return count;
  }

  async findWithCount(options?: AuthOptions): Promise<{ count: number; results: T[] }> {
    const { count, results } = (await this.app.request(
      {
        method: 'GET',
        path: `/1.1/classes/${this.className}`,
        query: { ...this.params, count: 1 },
      },
      options
    )) as { count: number; results: Record<string, any>[] };
    return {
      count,
      results: results.map((data) => this.decodeObject(data)),
    };
  }

  scan(options?: Omit<AuthOptions, 'useMasterKey'>): QueryIterator<T> {
    return new QueryIterator(this, options);
  }

  [Symbol.asyncIterator](): QueryIterator<T> {
    return this.scan();
  }
}

class QueryIterator<T> {
  private _app: App;
  private _className: string;
  private _query: Query<T>;
  private _limit?: number;
  private _condition?: Condition;
  private _cursor?: string;
  private _options?: AuthOptions;

  constructor(query: Query<T>, options?: Omit<AuthOptions, 'useMasterKey'>) {
    this._app = query.app;
    this._className = query.className;
    this._query = query;
    this._options = { ...options, useMasterKey: true };
    const { limit, where } = query.params;
    this._limit = limit;
    this._condition = where;
  }

  async next(): Promise<{ value: T[]; done: boolean }> {
    if (this._cursor === null) {
      return { value: [], done: true };
    }

    const { results = [], cursor: cursor = null } = (await this._app.request(
      {
        method: 'GET',
        path: `/1.1/scan/classes/${this._className}`,
        query: {
          cursor: this._cursor,
          limit: this._limit,
          where: this._condition,
        },
      },
      this._options
    )) as { results: Record<string, any>[]; cursor: string | null };

    this._cursor = cursor;
    return {
      value: results.map((data) => this._query.decodeObject(data)),
      done: cursor === null && results.length === 0,
    };
  }
}
