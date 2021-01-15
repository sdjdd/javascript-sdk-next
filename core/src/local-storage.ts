import { log, mustGetAdapter } from './runtime';
import { SyncStorage } from '@leancloud/adapter-types';
import { SDKError, ErrorName } from '../../common/error';

function mustGetSyncStorage(): SyncStorage {
  const storage = mustGetAdapter('storage');
  if (storage.async) {
    throw new SDKError(ErrorName.ASYNC_STORAGE);
  }
  return storage as SyncStorage;
}

class LocalStorage {
  set(key: string, value: string): void {
    mustGetSyncStorage().setItem(key, value);
    log.trace('localStorage:set', { key, value });
  }

  get(key: string): string {
    const value = mustGetSyncStorage().getItem(key);
    log.trace('localStorage:get', { key, value });
    return value;
  }

  remove(key: string): void {
    mustGetSyncStorage().removeItem(key);
    log.trace('localStorage:remove', { key });
  }

  async setAsync(key: string, value: string): Promise<void> {
    await mustGetAdapter('storage').setItem(key, value);
    log.trace('localStorage:set', { key, value });
  }

  async getAsync(key: string): Promise<string> {
    const value = await mustGetAdapter('storage').getItem(key);
    log.trace('localStorage:get', { key, value });
    return value;
  }

  async removeAsync(key: string): Promise<void> {
    await mustGetAdapter('storage').removeItem(key);
    log.trace('localStorage:remove', { key });
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
