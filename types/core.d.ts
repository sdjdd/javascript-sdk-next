export interface AppConfig {
  appId: string;
  appKey: string;
  serverURL?: string;
  masterKey?: string;
}

export interface App {
  readonly appId: string;
}

export interface AuthOptions {
  useMasterKey?: boolean;
  user?: {
    sessionToken: string;
  };
}

export interface RequestTask<T = any> extends Promise<T> {
  abort(): void;
}
