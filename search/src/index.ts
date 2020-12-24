import { FullTextSearch } from './search';

declare module '../../core' {
  interface App {
    search(className?: string): FullTextSearch;
  }
}

export const name = 'search';
export function onLoad({ modules }): void {
  const { App } = modules.core.components;
  App.prototype.search = function (className?: string) {
    return new FullTextSearch(this, className);
  };
}

export * from './search';
