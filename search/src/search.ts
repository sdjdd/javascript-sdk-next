import castArray from 'lodash/castArray';

import type { App, AuthOptions, LCObject, QueryOrder } from '../../core';

export type FullTextSearchSortMode = 'min' | 'max' | 'sum' | 'avg';

export type FullTextSearchOrder = 'asc' | 'desc';

export interface SearchParamse {
  q: string;
  clazz?: string;
  skip?: number;
  limit?: number;
  sid?: string;
  fields?: string;
  highlights?: string;
  include?: string;
  order?: string;
  sort?: any[];
}

export interface FullTextSearchSortOptions {
  order?: FullTextSearchOrder;
  mode?: FullTextSearchSortMode;
  missing?: 'first' | 'last';
}

interface FullTextSearchNearOptions {
  order?: FullTextSearchOrder;
  mode?: FullTextSearchSortMode;
  unit?: 'cm' | 'm' | 'km';
}

interface GeoPoint {
  latitude: number;
  longitude: number;
}

export class FullTextSearch {
  private _clazz?: string;
  private _q?: string;
  private _skip?: number;
  private _limit?: number;
  private _sid?: string;
  private _fields?: string[];
  private _include?: string[];
  private _highlights?: string[];
  private _order?: Set<string>;
  private _sort?: any[];

  constructor(public readonly app: App, className?: string) {
    this._clazz = className;
  }

  get params(): SearchParamse {
    if (!this._q) {
      throw new Error('执行全文搜索时必须提供 queryString');
    }
    const params: SearchParamse = {
      q: this._q,
      clazz: this._clazz,
      skip: this._skip,
      limit: this._limit,
      sid: this._sid,
    };
    if (this._fields?.length) {
      params.fields = this._fields.join(',');
    }
    if (this._highlights?.length) {
      params.highlights = this._highlights.join(',');
    }
    if (this._include?.length) {
      params.include = this._include.join(',');
    }
    if (this._order?.size) {
      params.order = Array.from(this._order).join(',');
    }
    if (this._sort?.length) {
      params.sort = this._sort;
    }
    return params;
  }

  queryString(str: string): this {
    this._q = str;
    return this;
  }

  skip(count: number): this {
    this._skip = count;
    return this;
  }

  limit(count: number): this {
    this._limit = count;
    return this;
  }

  sid(sid: string): this {
    this._sid = sid;
    return this;
  }

  fields(fields: string[]): this;
  fields(...fields: string[]): this;
  fields(fields: string | string[], ...rest: string[]): this {
    this._fields = castArray(fields).concat(rest);
    return this;
  }

  include(keys: string[]): this;
  include(...keys: string[]): this;
  include(keys: string | string[], ...rest: string[]): this {
    this._include = castArray(keys).concat(rest);
    return this;
  }

  highlights(keys: string[]): this;
  highlights(...keys: string[]): this;
  highlights(keys: string | string[], ...rest: string[]): this {
    this._highlights = castArray(keys).concat(rest);
    return this;
  }

  orderBy(key: string, order?: FullTextSearchOrder): this;
  orderBy(key: string, options: FullTextSearchSortOptions): this;
  orderBy(key: string, order?: FullTextSearchOrder | FullTextSearchSortOptions): this {
    if (!order || typeof order === 'string') {
      return this._orderBy(key, order as FullTextSearchOrder);
    } else {
      return this._sortBy(key, order);
    }
  }

  whereNear(key: string, geo: GeoPoint, options?: FullTextSearchNearOptions): this {
    if (!this._sort) {
      this._sort = [];
    }
    this._sort.push({
      _geo_distance: {
        ...options,
        [key]: [geo.latitude, geo.longitude],
      },
    });
    return this;
  }

  async find(options?: AuthOptions): Promise<FullTextSearchResult> {
    const rawResult = await this.app.request(
      {
        method: 'GET',
        path: '/1.1/search/select',
        query: this.params,
      },
      options
    );
    return new FullTextSearchResult(this.app, rawResult);
  }

  private _orderBy(key: string, order: QueryOrder = 'asc'): this {
    if (!this._order) {
      this._order = new Set();
    }
    switch (order) {
      case 'asc':
        this._order.add(key).delete('-' + key);
        break;
      case 'desc':
        this._order.add('-' + key).delete(key);
        break;
      default:
        throw new TypeError(`未知的查询排序方式 ${order}`);
    }
    return this;
  }

  private _sortBy(key: string, options: FullTextSearchSortOptions): this {
    if (!this._sort) {
      this._sort = [];
    }
    this._sort.push({ [key]: options });
    return this;
  }
}

interface RawResult {
  hits: number;
  results: Record<string, any>[];
  sid: string;
}

export class FullTextSearchResult {
  hits = 0;
  data: LCObject[] = [];
  sid: string;

  constructor(private _app: App, rawResult: RawResult) {
    this._setRawResult(rawResult);
  }

  private _setRawResult(rawResult: RawResult): void {
    this.sid = rawResult.sid;
    if (rawResult.hits) {
      this.hits = rawResult.hits;
    }
    if (rawResult.results) {
      const db = this._app.database();
      this.data = rawResult.results.map((result) => db.decodeObject(result));
    }
  }

  async next(options?: AuthOptions): Promise<this> {
    if (this.data.length === 0) {
      return this;
    }
    this._setRawResult(
      await this._app.request(
        {
          method: 'GET',
          path: '/1.1/search/select',
          query: { sid: this.sid },
        },
        options
      )
    );
    return this;
  }
}
