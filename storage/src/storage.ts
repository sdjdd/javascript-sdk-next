import b64ab from 'base64-arraybuffer';

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
    if (data.blob) {
      // React Native
      data = { ...data.blob, name, type: options?.mime ?? data.blob.type };
    } else {
      data = parseFileData(data);
    }
    const metaData = { ...options?.metaData };

    metaData.owner = (await getCurrentUserID(this.app)) || 'unknown';
    if (typeof metaData.size !== 'number') {
      metaData.size = data.size ?? data.length;
    }

    const tokens = await this._getFileTokens(name, { ...options, metaData });
    try {
      const provider = this._getFileProvider(tokens.provider);
      await provider.upload(name, data, tokens, options);
      await this._invokeFileCallback(tokens.token, true);
    } catch (e) {
      await this._invokeFileCallback(tokens.token, false);
      throw e;
    }

    return LCFile.fromJSON(this.app, {
      name,
      metaData,
      objectId: tokens.objectId,
      bucket: tokens.bucket,
      key: tokens.key,
      mime_type: tokens.mime_type,
      provider: tokens.provider,
      url: tokens.url,
      createdAt: tokens.createdAt,
      updatedAt: tokens.createdAt,
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
    throw new Error(`Uploading files to ${name} is not supported`);
  }

  private async _invokeFileCallback(token: string, success: boolean): Promise<void> {
    await this.app.request({
      method: 'POST',
      path: '/1.1/fileCallback',
      body: { token, result: success },
    });
  }
}

async function getCurrentUserID(app: App): Promise<string | null> {
  if (app.payload['current_user']) {
    return app.payload['current_user'].id;
  }
  const user_str = await app.localStorage.getAsync('current_user');
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
    throw new Error(
      'The current platform does not support building file using UTF-8 encoded strings'
    );
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
    throw new Error('The current platform does not support building file using a byte array');
  }

  if (typeof data.base64 === 'string') {
    const base64 = base64InDataURLs(data.base64);
    if (typeof Blob !== 'undefined') {
      return new Blob([b64ab.decode(base64)]);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64');
    }
    throw new Error(
      'The current platform does not support building file using base64 encoded strings'
    );
  }

  return data;
}
