import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../../../config/env';

export const s3Client = new S3Client({
  region: env.S3_REGION,
  ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {}), // Solo agrega el endpoint si viene en el .env
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});