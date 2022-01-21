import { DataIterator } from './base';

export { DataIterator };

export type DataIteratorFactory = (
  data: any,
  chunkSize: number,
  threshold: number
) => DataIterator | undefined;

const dataIteratorFactoryRef: { current?: DataIteratorFactory } = {};

export function registerDataIteratorFactory(factory: DataIteratorFactory) {
  dataIteratorFactoryRef.current = factory;
}

export function tryToCreateDataIterator(data: any, chunkSize: number, threshold: number) {
  return dataIteratorFactoryRef.current?.(data, chunkSize, threshold);
}
