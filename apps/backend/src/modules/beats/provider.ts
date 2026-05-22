import { storageConfig } from '@/config/storage.js';
import { localFileStorage } from './local-storage.js';
import type { StorageProvider } from './storage.js';

export function getStorageProvider(): StorageProvider {
  switch (storageConfig.provider) {
    case 'local':
    default:
      return localFileStorage;
  }
}
