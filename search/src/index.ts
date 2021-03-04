import type { Runtime } from '../../core';
import { FullTextSearch } from './search';

declare module '../../core' {
  interface Database {
    search(className?: string): FullTextSearch;
  }
}

export * from './search';
export const searchModule = {
  name: 'search',
  components: { Search: FullTextSearch },
  onLoad: ({ modules }: Runtime) => {
    const { Database } = modules.core.components;
    Database.prototype.search = function (className?: string) {
      return new FullTextSearch(this.app, className);
    };
  },
};
