import { FullTextSearch } from './search';

declare module '../../core' {
  interface Database {
    search(className?: string): FullTextSearch;
  }
}

export const name = 'search';
export function onLoad({ modules }): void {
  const { Database } = modules.core.components;
  Database.prototype.search = function (className?: string) {
    return new FullTextSearch(this.app, className);
  };
}

export * from './search';
