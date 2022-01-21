import { Readable } from 'stream';

import { registerDataIteratorFactory } from '.';
import { DataIterator } from './base';

class BufferIterator extends DataIterator<Buffer> {
  get size() {
    return this.data.length;
  }

  async next() {
    if (this.offset >= this.size) {
      return { done: true };
    }
    const chunk = this.data.slice(this.offset, this.offset + this.chunkSize);
    this.offset += chunk.length;
    return { done: false, value: chunk };
  }
}

class StreamIterator extends DataIterator<Readable> {
  get size() {
    return undefined;
  }

  private read(): Buffer | null {
    const chunk = this.data.read(this.chunkSize) as Buffer | null;
    if (chunk) {
      this.offset += chunk.length;
    }
    return chunk;
  }

  async next(): Promise<{ done: boolean; value?: Buffer }> {
    if (this.data.readableEnded) {
      return { done: true };
    }
    if (this.data.readableLength >= this.chunkSize) {
      return { done: false, value: this.read() };
    }
    return new Promise((resolve, reject) => {
      const onReadable = () => {
        // 当内部缓冲区有数据可供读取时，尝试读取 this.chunkSize 长度的数据
        const chunk = this.read();
        if (chunk) {
          // 成功读取到指定长度的数据后将其返回，否则继续等待
          removeListeners();
          resolve({ done: false, value: chunk });
        }
      };
      const onError = (error: Error) => {
        removeListeners();
        reject(error);
      };
      const removeListeners = () => {
        this.data.off('readable', onReadable);
        this.data.off('error', onError);
      };
      this.data.on('readable', onReadable);
      this.data.on('error', onError);
    });
  }
}

function makeDataIterator(
  data: any,
  chunkSize: number,
  threshold: number
): DataIterator | undefined {
  if (Buffer.isBuffer(data) && data.length >= threshold) {
    return new BufferIterator(data, chunkSize);
  }
  if (data instanceof Readable) {
    return new StreamIterator(data, chunkSize);
  }
}

registerDataIteratorFactory(makeDataIterator);
