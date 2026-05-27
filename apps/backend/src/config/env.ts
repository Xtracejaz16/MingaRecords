import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'RESEND_API_KEY',
] as const;

function getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function getEnvVarNumber(name: string, defaultValue: number): number {
    const value = process.env[name];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Environment variable ${name} must be a number, got: ${value}`);
    }
    return parsed;
}

function getOptionalEnvVar(name: string): string | undefined {
    return process.env[name];
}

for (const name of requiredEnvVars) {
    getEnvVar(name);
}

const hasS3 = Boolean(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY && process.env.S3_BUCKET_NAME);
const storageDriver = getOptionalEnvVar('STORAGE_DRIVER') ?? (hasS3 ? 's3' : 'local');

// Ensure uploads directory exists for local driver
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
if (storageDriver === 'local' && !fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export const env = {
    jwtSecret: getEnvVar('JWT_SECRET'),
    databaseUrl: getEnvVar('DATABASE_URL'),
    resendApiKey: getEnvVar('RESEND_API_KEY'),
    port: getEnvVarNumber('PORT', 3000),
    isProduction: process.env.NODE_ENV === 'production',
    storageDriver: storageDriver as 'local' | 's3',
    uploadsDir,
    // S3 — opcional, solo se usan si storageDriver === 's3'
    s3Region: getOptionalEnvVar('S3_REGION') ?? 'us-east-1',
    s3Endpoint: getOptionalEnvVar('S3_ENDPOINT'),
    s3AccessKey: getOptionalEnvVar('S3_ACCESS_KEY') ?? '',
    s3SecretKey: getOptionalEnvVar('S3_SECRET_KEY') ?? '',
    s3BucketName: getOptionalEnvVar('S3_BUCKET_NAME') ?? '',
} as const;
