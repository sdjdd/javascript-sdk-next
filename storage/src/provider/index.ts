import { HTTPResponse } from '../../../core';
import { FileTokens, UploadOptions } from '../storage';
import { Qiniu } from './qiniu';
import { S3 } from './s3';

export interface Provider {
  upload(
    name: string,
    data: any,
    tokens: FileTokens,
    options?: UploadOptions
  ): Promise<HTTPResponse>;
}

export const providers: Record<string, Provider> = {
  qiniu: new Qiniu(),
  s3: new S3(),
};
