// Storage configuration — swap STORAGE_PROVIDER to "firebase" when cloud keys are ready.

export type StorageProviderType = 'local' | 'firebase';

export const storageConfig = {
  provider: (process.env.STORAGE_PROVIDER ?? 'local') as StorageProviderType,
  localStoragePath: process.env.LOCAL_STORAGE_PATH ?? './public/beats',
} as const;
