export enum ErrorCode {
  UNKNOWN,
  ASYNC_STORAGE,
}

export const DEFAULT_ERROR_MESSAGE = {
  [ErrorCode.ASYNC_STORAGE]: '当前平台提供了异步的数据存储功能，请使用异步方法执行当前操作',
};

export class SDKError extends Error {
  readonly isSDKError = true;

  static readonly code = ErrorCode;

  constructor(public readonly code: ErrorCode, message?: string) {
    super(message || DEFAULT_ERROR_MESSAGE[code]);
  }

  static is(error: SDKError, code: ErrorCode): boolean {
    return error.isSDKError && error.code === code;
  }
}
