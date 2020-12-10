import type { Database } from '../types/database';

declare module '../types/core' {
  interface App {
    database(): Database;
  }
}
