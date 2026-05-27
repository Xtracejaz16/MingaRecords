import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from './s3.client.js';
import { env } from '@/config/env.js';
import type { StoragePort, UploadResult } from './types.js';

export class S3Adapter implements StoragePort {
  private bucket = env.s3BucketName;

  async upload(file: Express.Multer.File, beatId: string, userId: string): Promise<UploadResult> {
    const key = `beats/${userId}/${beatId}/${Date.now()}-${file.originalname}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    const url = `${env.s3Endpoint}/${this.bucket}/${key}`;
    return { key, url };
  }

  async getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  async delete(key: string): Promise<void> {
    await s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
