import type { HTTPRequestOptions } from '../../../core';
import { SDKRuntime } from '../runtime';
import type { FileTokens } from '../storage';
import type { Provider } from '.';

export class S3 implements Provider {
  async upload(
    name: string,
    data: any,
    tokens: FileTokens,
    options?: HTTPRequestOptions & { header: Record<string, string> }
  ): Promise<void> {
    await SDKRuntime.http.request(
      {
        method: 'PUT',
        url: tokens.upload_url,
        header: {
          'Content-Type': tokens.mime_type,
          'Cache-Control': 'public, max-age=31536000',
          ...options?.header,
        },
        body: data,
      },
      options
    );
  }
}
