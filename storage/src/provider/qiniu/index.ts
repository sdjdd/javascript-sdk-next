import type { HTTPRequestOptions } from '../../../../core';
import { SDKRuntime } from '../../runtime';
import type { FileTokens } from '../../storage';
import type { Provider } from '..';
import { isBlob, isBuffer, isStream } from '../../utils/data-type';
import { ShardUploader, BlobIterator, BufferIterator, StreamIterator } from './shard-uploader';

export const SHARD_THRESHOLD = 1024 * 1025 * 64;

export class Qiniu implements Provider {
  async upload(
    name: string,
    data: any,
    tokens: FileTokens,
    options?: HTTPRequestOptions & { header: Record<string, string> }
  ): Promise<void> {
    if (isBlob(data) && data.size >= SHARD_THRESHOLD) {
      return new ShardUploader(tokens, new BlobIterator(data)).upload(name, options);
    }
    if (isBuffer(data) && data.length >= SHARD_THRESHOLD) {
      return new ShardUploader(tokens, new BufferIterator(data)).upload(name, options);
    }
    if (isStream(data)) {
      return new ShardUploader(tokens, new StreamIterator(data)).upload(name, options);
    }
    await SDKRuntime.http.upload(
      {
        method: 'POST',
        url: tokens.upload_url,
        file: { name, data, field: 'file' },
        form: { name, key: tokens.key, token: tokens.token },
        header: options?.header,
      },
      options
    );
  }
}
