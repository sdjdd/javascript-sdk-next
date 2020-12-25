import { mustGetAdapter } from './adapter';
import { SyncStorage } from '@leancloud/adapter-types';
import { SDKError } from '../../common/error';

function mustGetSyncStorage(): SyncStorage {
  const storage = mustGetAdapter('storage');
  if (storage.async) {
    throw new SDKError(SDKError.code.ASYNC_STORAGE);
  }
  return storage as SyncStorage;
}

class LocalStorage {
  set(key: string, value: string): void {
    mustGetSyncStorage().setItem(key, value);
  }

  get(key: string): string {
    return mustGetSyncStorage().getItem(key);
  }

  remove(key: string): void {
    mustGetSyncStorage().removeItem(key);
  }

  async setAsync(key: string, value: string): Promise<void> {
    await mustGetAdapter('storage').setItem(key, value);
  }

  async getAsync(key: string): Promise<string> {
    return await mustGetAdapter('storage').getItem(key);
  }

  async removeAsync(key: string): Promise<void> {
    await mustGetAdapter('storage').removeItem(key);
  }
}

export class NamespacedStorage implements LocalStorage {
  constructor(public readonly storage: LocalStorage, public readonly namespace: string) {}

  set(key: string, value: string): void {
    this.storage.set(this.namespace + '/' + key, value);
  }

  get(key: string): string {
    return this.storage.get(this.namespace + '/' + key);
  }

  remove(key: string): void {
    this.storage.remove(this.namespace + '/' + key);
  }

  async setAsync(key: string, value: string): Promise<void> {
    await this.storage.setAsync(this.namespace + '/' + key, value);
  }

  async getAsync(key: string): Promise<string> {
    return await this.storage.getAsync(this.namespace + '/' + key);
  }

  async removeAsync(key: string): Promise<void> {
    await this.storage.removeAsync(this.namespace + '/' + key);
  }
}

export const localStorage = new NamespacedStorage(new LocalStorage(), 'LC');
