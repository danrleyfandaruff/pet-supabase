import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private _storage: Storage | null = null;
  private isReady = false;

  constructor(private storage: Storage) {}

  async init(): Promise<void> {
    if (!this.isReady) {
      this._storage = await this.storage.create();
      this.isReady = true;
    }
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.init();
    await this._storage?.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.init();
    return (await this._storage?.get(key)) ?? null;
  }

  async remove(key: string): Promise<void> {
    await this.init();
    await this._storage?.remove(key);
  }

  async clear(): Promise<void> {
    await this.init();
    await this._storage?.clear();
  }
}
