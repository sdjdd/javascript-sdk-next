import type { Readable } from 'stream';

import type { HTTPRequest, HTTPRequestOptions } from '../../../../core';
import { SDKRuntime } from '../../runtime';
import type { FileTokens } from '../../storage';
import { utoh } from '../../utils/base64';

export const CHUNK_SIZE = 1024 * 1024 * 16;

export interface Part {
  partNumber: number;
  etag: string;
}

export abstract class DataIterator {
  protected _offset = 0;

  constructor(readonly data: any, readonly size?: number) {}

  abstract next(): Promise<{ done: boolean; value?: any }>;

  [Symbol.asyncIterator]() {
    return this;
  }
}

export class BlobIterator extends DataIterator {
  constructor(readonly data: Blob) {
    super(data, data.size);
  }

  async next(): Promise<{ done: boolean; value?: Blob }> {
    if (this._offset >= this.size) {
      return { done: true };
    }
    const chunk = this.data.slice(this._offset, this._offset + CHUNK_SIZE);
    this._offset += chunk.size;
    return { done: false, value: chunk };
  }
}

export class BufferIterator extends DataIterator {
  constructor(readonly data: Buffer) {
    super(data, data.length);
  }

  async next(): Promise<{ done: boolean; value?: Buffer }> {
    if (this._offset >= this.size) {
      return { done: true };
    }
    const chunk = this.data.slice(this._offset, this._offset + CHUNK_SIZE);
    this._offset += chunk.length;
    return { done: false, value: chunk };
  }
}

export class StreamIterator extends DataIterator {
  constructor(readonly data: Readable) {
    super(data);
  }

  private _read(size?: number): Buffer | null {
    const chunk = this.data.read(size);
    if (chunk) {
      this._offset += chunk.length;
    }
    return chunk;
  }

  async next(): Promise<{ done: boolean; value?: Buffer }> {
    if (this.data.readableEnded) {
      return { done: true };
    }
    if (this.data.readableLength >= CHUNK_SIZE) {
      return { done: false, value: this._read(CHUNK_SIZE) };
    }
    return new Promise((resolve, reject) => {
      const onReadable = () => {
        const chunk = this._read(CHUNK_SIZE);
        if (chunk !== null) {
          resolve({ done: false, value: chunk });
          removeListeners();
        }
      };
      const onError = (error: Error) => {
        reject(error);
        removeListeners();
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
      throw new Error(JSON.stringify(body));
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
