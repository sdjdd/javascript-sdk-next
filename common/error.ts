export enum ErrorName {
  UNKNOWN = 'UNKNOWN',
  ASYNC_STORAGE = 'ASYNC_STORAGE',
}

export const DEFAULT_ERROR_MESSAGE = {
  [ErrorName.ASYNC_STORAGE]: '当前平台提供了异步的数据存储功能，请使用异步方法执行当前操作',
};

export class SDKError extends Error {
  readonly isSDKError = true;

  constructor(public readonly name: ErrorName, message?: string) {
    super(message || DEFAULT_ERROR_MESSAGE[name]);
  }
}

export class APIError extends Error {
  constructor(public code: number, public error: string) {
    super(`code: ${code}, error: ${error}`);
  }
}
