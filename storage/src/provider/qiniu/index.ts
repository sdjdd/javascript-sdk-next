import type { HTTPRequestOptions } from '../../../../core';
import type { FileTokens } from '../../storage';
import type { Provider } from '..';

import { SDKRuntime } from '../../runtime';
import { makeDataIterator } from '../../data-iterator';
import { CHUNK_SIZE, ShardUploader } from './shard-uploader';

export const SHARD_THRESHOLD = 1024 * 1024 * 64;

export class Qiniu implements Provider {
  async upload(
    name: string,
    data: any,
    tokens: FileTokens,
    options?: HTTPRequestOptions & { header: Record<string, string> }
  ): Promise<void> {
    const dataIterator = makeDataIterator(data, CHUNK_SIZE, SHARD_THRESHOLD);
    if (dataIterator) {
      return new ShardUploader(tokens, dataIterator).upload(name, options);
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
