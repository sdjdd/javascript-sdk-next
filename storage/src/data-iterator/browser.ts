import { registerDataIteratorFactory } from '.';
import { DataIterator } from './base';

class BlobIterator extends DataIterator<Blob> {
  get size() {
    return this.data.size;
  }

  async next() {
    if (this.offset >= this.size) {
      return { done: true };
    }
    const chunk = this.data.slice(this.offset, this.offset + this.chunkSize);
    this.offset += chunk.size;
    // XXX: 适配 Safari 13
    const value = await new Response(chunk).arrayBuffer();
    return { done: false, value };
  }
}

function makeDataIterator(
  data: any,
  chunkSize: number,
  threshold: number
): DataIterator | undefined {
  if (data instanceof Blob && data.size >= threshold) {
    return new BlobIterator(data, chunkSize);
  }
}

registerDataIteratorFactory(makeDataIterator);
