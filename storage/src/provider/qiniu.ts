import { Provider } from '.';
import { HTTPResponse } from '../../../core';
import { SDKRuntime } from '../runtime';
import { FileTokens, UploadOptions } from '../storage';

export class Qiniu implements Provider {
  upload(
    name: string,
    data: any,
    tokens: FileTokens,
    options?: UploadOptions
  ): Promise<HTTPResponse> {
    return SDKRuntime.http.upload(
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
