import { z } from 'zod';

// --- Input Schemas ---

export const CreateBeatInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
});

export const UpdateBeatInputSchema = z
  .object({
    title: z.string().min(1, 'Title cannot be empty'),
    description: z.string().optional(),
    price: z.number().positive('Price must be greater than 0'),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// --- TypeScript Types ---

export type CreateBeatInput = z.infer<typeof CreateBeatInputSchema>;
export type UpdateBeatInput = z.infer<typeof UpdateBeatInputSchema>;

export interface Beat {
  id: string;
  title: string;
  description: string | null;
  price: number;
  isSold: boolean;
  audioUrl: string;
  coverUrl: string;
  sellerId: string;
  buyerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
