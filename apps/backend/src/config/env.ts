import dotenv from 'dotenv';

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

for (const name of requiredEnvVars) {
    getEnvVar(name);
}

export const env = {
    jwtSecret: getEnvVar('JWT_SECRET'),
    databaseUrl: getEnvVar('DATABASE_URL'),
    resendApiKey: getEnvVar('RESEND_API_KEY'),
    port: getEnvVarNumber('PORT', 3000),
    isProduction: process.env.NODE_ENV === 'production',
} as const;
