export interface StorageProvider {
  uploadFile(buffer: Buffer, filename: string, mimetype: string): Promise<string>;
  deleteFile(url: string): Promise<void>;
}
