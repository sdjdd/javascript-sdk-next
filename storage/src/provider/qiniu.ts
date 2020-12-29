import { Provider } from '.';
import { App, HTTPResponse } from '../../../core';
import { FileTokens, UploadOptions } from '../storage';

export class Qiniu implements Provider {
  constructor(public readonly app: App) {}

  upload(
    name: string,
    data: any,
    tokens: FileTokens,
    options?: UploadOptions
  ): Promise<HTTPResponse> {
    return this.app.upload(
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
