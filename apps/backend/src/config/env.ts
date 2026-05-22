import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.string().default('development'),
  JWT_SECRET: z.string().min(32, 'JWT Secret es requerido'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY es requerida'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY: z.string().min(1, 'S3 Access Key es requerida'),
  S3_SECRET_KEY: z.string().min(1, 'S3 Secret Key es requerida'),
  S3_BUCKET_NAME: z.string().min(1, 'S3 Bucket Name es requerido'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error fatal: Variables de entorno inválidas:', parsed.error.format());
  process.exit(1);
}

export const env = {
  port: parsed.data.PORT,
  isProduction: parsed.data.NODE_ENV === 'production',
  jwtSecret: parsed.data.JWT_SECRET,
  databaseUrl: parsed.data.DATABASE_URL,
  resendApiKey: parsed.data.RESEND_API_KEY,
  s3Region: parsed.data.S3_REGION,
  s3Endpoint: parsed.data.S3_ENDPOINT,
  s3AccessKey: parsed.data.S3_ACCESS_KEY,
  s3SecretKey: parsed.data.S3_SECRET_KEY,
  s3BucketName: parsed.data.S3_BUCKET_NAME,
} as const;