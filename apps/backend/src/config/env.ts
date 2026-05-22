import { z } from 'zod';
import * as dotenv from 'dotenv'

// Cargar el archivo .env si existe
dotenv.config();

const envSchema = z.object({
PORT: z.string().default('3000').transform((val) => parseInt(val, 10)),
  
  // Variables obligatorias para el módulo de almacenamiento (S3 / R2 / Supabase)
  S3_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: z.string().url().optional(), // Por si usan Supabase/R2
 S3_ACCESS_KEY: z.string().min(1, 'S3 Access Key es requerida'), // Con doble 'S'
  S3_SECRET_KEY: z.string().min(1, 'S3 Secret Key es requerida'), // Con la 'T' al final
  S3_BUCKET_NAME: z.string().min(1, 'S3 Bucket Name es requerido'),
});

// Validar las variables de entorno actuales
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Error fatal: Variables de entorno inválidas:', parsedEnv.error.format());
  process.exit(1);
}

// Exportar de forma nombrada para que coincida con tus otros archivos
export const env = parsedEnv.data;