import type { Auth } from './dist';

declare module '../types/core' {
  interface App {
    auth(): Auth;
  }
}
