export abstract class DataIterator<TData = any> {
  abstract size?: number;
  protected offset = 0;

  constructor(readonly data: TData, readonly chunkSize: number) {}

  abstract next(): Promise<{ done: boolean; value?: ArrayBuffer }>;

  [Symbol.asyncIterator]() {
    return this;
  }
}
