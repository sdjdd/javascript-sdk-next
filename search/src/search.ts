import uniq from 'lodash/uniq';

import type { App, AuthOptions, LCObject, QueryParams } from '../../core';
import { ensureArray } from '../../common/utils';

export type FullTextSearchSortMode = 'min' | 'max' | 'sum' | 'avg';

export type FullTextSearchOrder = 'asc' | 'desc';

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
  readonly params: QueryParams = {};

  constructor(public readonly app: App, className?: string) {
    this.params.clazz = className;
  }

  queryString(str: string): this {
    this.params.q = str;
    return this;
  }

  skip(count: number): this {
    this.params.skip = count;
    return this;
  }

  limit(count: number): this {
    this.params.limit = count;
    return this;
  }

  sid(sid: string): this {
    this.params.sid = sid;
    return this;
  }

  fields(fields: string[]): this;
  fields(...fields: string[]): this;
  fields(field: string | string[], ...rest: string[]): this {
    const fields = ensureArray(field)
      .concat(rest)
      .concat((this.params.fields as string)?.split(','));
    this.params.fields = uniq(fields).join(',');
    return this;
  }

  include(keys: string[]): this;
  include(...keys: string[]): this;
  include(key: string | string[], ...rest: string[]): this {
    const include = ensureArray(key)
      .concat(rest)
      .concat((this.params.include as string)?.split(','));
    this.params.include = uniq(include).join(',');
    return this;
  }

  highlights(keys: string[]): this;
  highlights(...keys: string[]): this;
  highlights(key: string | string[], ...rest: string[]): this {
    const highlights = ensureArray(key)
      .concat(rest)
      .concat((this.params.highlights as string)?.split(','));
    this.params.highlights = uniq(highlights).join(',');
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
    if (!this.params.sort) {
      this.params.sort = [];
    }
    this.params.sort.push({
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

  private _orderBy(key: string, direction?: 'asc' | 'desc'): this {
    const order = new Set((this.params.order as string)?.split(','));
    if (direction === 'desc') {
      order.add('-' + key);
      order.delete(key);
    } else {
      order.add(key);
      order.delete('-' + key);
    }
    this.params.order = Array.from(order).join(',');
    return this;
  }

  private _sortBy(key: string, options: FullTextSearchSortOptions): this {
    if (!this.params.sort) {
      this.params.sort = [];
    }
    this.params.sort.push({ [key]: options });
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
