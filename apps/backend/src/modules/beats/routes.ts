import { z } from 'zod';

// --- Zod Schemas for License Routes ---

export const UpsertLicenseItemSchema = z.object({
  type: z.enum(['BASIC', 'PREMIUM', 'EXCLUSIVE'], {
    message: 'Tipo de licencia inválido. Usá BASIC, PREMIUM o EXCLUSIVE',
  }),
  priceCents: z.number().int().positive('El precio debe ser mayor a 0'),
  isActive: z.boolean().optional(),
});

export const UpsertLicensesBodySchema = z.array(UpsertLicenseItemSchema).min(1, 'Debe haber al menos una licencia');
