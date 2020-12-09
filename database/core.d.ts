import type { Database } from './dist';

declare module '../core' {
  interface App {
    database(): Database;
  }
}
