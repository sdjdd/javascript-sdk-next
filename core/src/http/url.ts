import { encodeQuery, IQuery } from './query';

export function encodeURL(base: string, query?: IQuery): string {
  if (query) {
    const queryString = encodeQuery(query);
    if (queryString) {
      return base + '?' + queryString;
    }
  }
  return base;
}
