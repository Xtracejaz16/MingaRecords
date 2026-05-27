import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@/config/env.js';

export const s3Client = new S3Client({
  region: env.s3Region,
  ...(env.s3Endpoint ? { endpoint: env.s3Endpoint } : {}),
  credentials: {
    accessKeyId: env.s3AccessKey,
    secretAccessKey: env.s3SecretKey,
  },
  forcePathStyle: true,
});
