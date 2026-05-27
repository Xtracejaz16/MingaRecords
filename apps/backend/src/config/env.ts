import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'RESEND_API_KEY',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
    'S3_BUCKET_NAME',
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

for (const name of requiredEnvVars) {
    getEnvVar(name);
}

export const env = {
    jwtSecret: getEnvVar('JWT_SECRET'),
    databaseUrl: getEnvVar('DATABASE_URL'),
    resendApiKey: getEnvVar('RESEND_API_KEY'),
    port: getEnvVarNumber('PORT', 3000),
    isProduction: process.env.NODE_ENV === 'production',
    s3Region: process.env.S3_REGION ?? 'us-east-1',
    s3Endpoint: process.env.S3_ENDPOINT ?? undefined,
    s3AccessKey: getEnvVar('S3_ACCESS_KEY'),
    s3SecretKey: getEnvVar('S3_SECRET_KEY'),
    s3BucketName: getEnvVar('S3_BUCKET_NAME'),
} as const;
