export interface StorageFile {
  key: string
  url: string
  size: number
  mimeType: string
  beatId: string
  uploadedBy: string
}

export interface UploadResult {
  key: string
  url: string
}
import 'multer';
export interface StoragePort {
  upload(file: Express.Multer.File, beatId: string, userId: string): Promise<UploadResult>
  getDownloadUrl(key: string): Promise<string>
  delete(key: string): Promise<void>
}