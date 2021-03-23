import { Provider } from '.';
import { HTTPResponse } from '../../../core';
import { SDKRuntime } from '../runtime';
import { FileTokens, UploadOptions } from '../storage';

export class S3 implements Provider {
  upload(
    _name: string,
    data: any,
    tokens: FileTokens,
    options?: UploadOptions
  ): Promise<HTTPResponse> {
    return SDKRuntime.http.request(
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
