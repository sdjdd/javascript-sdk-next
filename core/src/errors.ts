// TODO: 考虑下是否增加 HTTP Status
export class APIError extends Error {
  constructor(public code: number, public error: string) {
    super(`code: ${code}, error: ${error}`);
  }
}
