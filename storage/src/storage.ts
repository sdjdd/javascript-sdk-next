import { decode as base64ToArrayBuffer } from 'base64-arraybuffer';

import { KEY_CURRENT_USER } from '../../common/const';
import type { ACL, App, AuthOptions, Query } from '../../core';
import { Provider, providers } from './provider';
import { LCFile } from './file';

export interface UploadOptions extends AuthOptions {
  ACL?: ACL;
  key?: string;
  mime?: string;
  metaData?: Record<string, any>;
  header?: Record<string, string>;
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

export class Storage {
  constructor(public readonly app: App) {}

  queryFile(): Query<LCFile> {
    return this.app.database().class('_File', LCFile.fromJSON);
  }

  async upload(name: string, data: any, options?: UploadOptions): Promise<LCFile> {
    data = parseFileData(data);
    const metaData = { ...options?.metaData };

    metaData.owner = (await getCurrentUserID(this.app)) || 'unknown';
    if (typeof metaData.size !== 'number') {
      metaData.size = data.size ?? data.length;
    }

    const tokens = await this._getFileTokens(name, { ...options, metaData });
    const provider = this._getFileProvider(tokens.provider);
    try {
      await provider.upload(name, data, tokens, options);
      await this._invokeFileCallback(tokens.token, true);
    } catch (e) {
      await this._invokeFileCallback(tokens.token, false);
      throw e;
    }

    return LCFile.fromJSON(this.app, {
      ...tokens,
      name,
      metaData,
    });
  }

  async uploadWithURL(
    name: string,
    url: string,
    options?: Omit<UploadOptions, 'header'>
  ): Promise<LCFile> {
    const metaData = {
      ...options?.metaData,
      __source: 'external',
      owner: (await getCurrentUserID(this.app)) || 'unknown',
      size: 0,
    };

    const obj = await this.app
      .database()
      .class('_File')
      .add(
        {
          name,
          url,
          metaData,
          ACL: options?.ACL,
          mime_type: options?.mime,
        },
        { ...options, fetchData: true }
      );
    return new LCFile(obj);
  }

  private _getFileTokens(
    name: string,
    options?: Pick<UploadOptions, 'ACL' | 'key' | 'metaData' | 'mime'>
  ): Promise<FileTokens> {
    return this.app.request({
      method: 'POST',
      path: '/1.1/fileTokens',
      body: {
        name,
        ACL: options?.ACL,
        key: options?.key,
        metaData: options?.metaData,
        mime_type: options?.mime,
      },
    });
  }

  private _getFileProvider(name: string): Provider {
    if (name in providers) {
      return providers[name];
    }
    throw new Error(`暂不支持上传文件到 ${name}`);
  }

  private _invokeFileCallback(token: string, success: boolean): Promise<void> {
    return this.app.request({
      method: 'POST',
      path: '/1.1/fileCallback',
      body: { token, result: success },
    });
  }
}

async function getCurrentUserID(app: App): Promise<string | null> {
  if (app.payload[KEY_CURRENT_USER]) {
    return app.payload[KEY_CURRENT_USER].id;
  }
  const user_str = await app.localStorage.getAsync(KEY_CURRENT_USER);
  if (user_str) {
    return JSON.parse(user_str).objectId;
  }
  return null;
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
      return parseFileData({ base64: btoa(data) });
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(data, 'utf-8');
    }
    throw new Error('当前平台不支持使用 utf-8 编码的字符串构建文件');
  }

  if (Array.isArray(data)) {
    const u8arr = new Uint8Array(data.length);
    data.forEach((v, i) => (u8arr[i] = v));
    if (typeof Blob !== 'undefined') {
      return new Blob([u8arr]);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8arr);
    }
    throw new Error('当前平台不支持使用字节数组构建文件');
  }

  if (typeof data.base64 === 'string') {
    const base64 = base64InDataURLs(data.base64);
    if (typeof Blob !== 'undefined') {
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
