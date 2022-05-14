import type { HTTPRequest, HTTPRequestOptions } from '../../../../core';
import type { FileTokens } from '../../storage';
import type { DataIterator } from '../../data-iterator';

import { SDKRuntime } from '../../runtime';
import { utoh } from '../../utils/base64';

export const CHUNK_SIZE = 1024 * 1024 * 16;

export interface Part {
  partNumber: number;
  etag: string;
}

export class ShardUploader {
  readonly baseURL: string;
  readonly upToken: string;

  constructor(readonly fileTokens: FileTokens, readonly data: DataIterator) {
    const { upload_url, bucket, key, token } = fileTokens;
    this.baseURL = `${upload_url}/buckets/${bucket}/objects/${utoh(key)}/uploads`;
    this.upToken = `UpToken ${token}`;
  }

  async request(
    request: {
      method: HTTPRequest['method'];
      path?: string;
      body?: HTTPRequest['body'];
    },
    options?: HTTPRequestOptions
  ): Promise<any> {
    const { status, body } = await SDKRuntime.http.request(
      {
        method: request.method,
        url: this.baseURL + (request.path ?? ''),
        header: {
          Authorization: this.upToken,
        },
        body: request.body,
      },
      options
    );
    if (status >= 400) {
      throw new Error(body.error);
    }
    return body;
  }

  async getUploadId(options?: HTTPRequestOptions): Promise<string> {
    const { uploadId } = await this.request({ method: 'POST' }, options);
    return uploadId;
  }

  async uploadChunk(
    uploadId: string,
    partNumber: number,
    data: any,
    options?: HTTPRequestOptions
  ): Promise<string> {
    const { etag } = await this.request(
      {
        method: 'PUT',
        path: `/${uploadId}/${partNumber}`,
        body: data,
      },
      options
    );
    return etag;
  }

  async finish(uploadId: string, fileName: string, parts: Part[]): Promise<void> {
    await this.request({
      method: 'POST',
      path: `/${uploadId}`,
      body: {
        parts,
        fname: fileName,
        mimeType: this.fileTokens.mime_type,
      },
    });
  }

  async abort(uploadId: string): Promise<void> {
    await this.request({ method: 'DELETE', path: `/${uploadId}` });
  }

  async upload(fileName: string, options?: HTTPRequestOptions): Promise<void> {
    const uploadId = await this.getUploadId({ ...options, onProgress: undefined });
    const parts: Part[] = [];

    let uploaded = 0;
    let uploadedChunks = 0;
    const handleProgressChange = ({ loaded }: ProgressEvent) => {
      loaded += uploadedChunks * CHUNK_SIZE;
      if (loaded <= uploaded) {
        return;
      }
      uploaded = loaded;
      if (this.data.size) {
        options.onProgress({
          loaded,
          total: this.data.size,
          percent: (loaded / this.data.size) * 100,
        });
      } else {
        options.onProgress({ loaded });
      }
    };

    try {
      for await (const chunk of this.data) {
        if (!chunk) {
          break;
        }
        const partNumber = parts.length + 1;
        const etag = await this.uploadChunk(uploadId, partNumber, chunk, {
          ...options,
          onProgress: options?.onProgress ? handleProgressChange : undefined,
        });
        parts.push({ partNumber, etag });
        uploadedChunks++;
      }
    } catch (error) {
      await this.abort(uploadId);
      throw error;
    }

    await this.finish(uploadId, fileName, parts);
  }
}
