import { mustGetAdapter } from './adapters';
import { SyncStorage } from '@leancloud/adapter-types';

function mustGetSyncStorage(): SyncStorage {
  const storage = mustGetAdapter('storage');
  if (storage.async) {
    throw new Error('Current platform provides an async storage, please use async method instead');
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

export const localStorage = new LocalStorage();

export class NamespacedStorage implements LocalStorage {
  constructor(public readonly namespace: string) {}

  set(key: string, value: string): void {
    localStorage.set(this.namespace + '/' + key, value);
  }

  get(key: string): string {
    return localStorage.get(this.namespace + '/' + key);
  }

  remove(key: string): void {
    localStorage.remove(this.namespace + '/' + key);
  }

  async setAsync(key: string, value: string): Promise<void> {
    await localStorage.setAsync(this.namespace + '/' + key, value);
  }

  async getAsync(key: string): Promise<string> {
    return await localStorage.getAsync(this.namespace + '/' + key);
  }

  async removeAsync(key: string): Promise<void> {
    await localStorage.removeAsync(this.namespace + '/' + key);
  }
}
