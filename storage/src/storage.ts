import { decode as base64ToArrayBuffer } from 'base64-arraybuffer';

import { KEY_CURRENT_USER } from '../../common/const';
import type { ACL, App, AuthOptions } from '../../core';
import type { User } from '../../auth';

export interface UploadOptions extends AuthOptions {
  ACL?: ACL;
  mime?: string;
  metaData?: Record<string, any>;
}

export interface FileTokens {
  objectId: string;
  createdAt: string;
  token: string;
  url: string;
  mime_type: string;
  provider: string;
  upload_url: string;
  bucket: string;
  key: string;
}

function base64InDataURLs(urls: string): string {
  if (urls.startsWith('data:')) {
    const [meta, data] = urls.split(',');
    if (meta?.endsWith('base64')) {
      return data;
    }
  }
  return urls;
}

function parseFileData(data: any): any {
  if (typeof data === 'string') {
    if (typeof btoa !== 'undefined') {
      return parseFileData(btoa(data));
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(data, 'utf-8');
    }
    throw new Error('当前平台不支持使用 utf-8 编码的字符串构建文件');
  }

  if (Array.isArray(data)) {
    const u8arr = new Uint8Array(data.length);
    data.forEach((v, i) => (u8arr[i] = v));
    if (typeof Blob === 'function') {
      return new Blob([u8arr]);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8arr);
    }
    throw new Error('当前平台不支持使用字节数组构建文件');
  }

  if (typeof data.base64 === 'string') {
    const base64 = base64InDataURLs(data.base64);
    if (typeof Blob === 'function') {
      return new Blob([base64ToArrayBuffer(base64)]);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64');
    }
    throw new Error('当前平台不支持使用 base64 编码的字符串构建文件');
  }

  if (data.blob) {
    return data.blob;
  }

  return data;
}

export class Storage {
  constructor(public readonly app: App) {}

  async upload(name: string, data: any, options?: UploadOptions): Promise<any> {
    data = parseFileData(data);
    const metaData = { ...options?.metaData };

    metaData.owner = (await getCurrentUser(this.app))?.id || 'unknown';
    if (typeof metaData.size !== 'number') {
      metaData.size = data.size ?? data.length;
    }

    const tokens = await this._getFileTokens(name, { ...options, metaData });
    return tokens;
  }

  private _getFileTokens(
    name: string,
    options?: Pick<UploadOptions, 'ACL' | 'metaData' | 'mime'>
  ): Promise<FileTokens> {
    return this.app.request({
      method: 'POST',
      path: '/1.1/fileTokens',
      body: {
        name,
        ACL: options?.ACL,
        metaData: options?.metaData,
        mime_type: options?.mime,
      },
    });
  }
}

async function getCurrentUser(app: App): Promise<User | null> {
  if (KEY_CURRENT_USER in app.payload) {
    return await app.payload[KEY_CURRENT_USER];
  }
  return null;
}
