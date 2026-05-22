import { z } from 'zod';

// --- Const Types ---

const BEAT_STATUS = {
  DRAFT: 'draft',
  PENDING_AUDIO: 'pending_audio',
  PROCESSING: 'processing',
  READY: 'ready',
  PUBLISHED: 'published',
  SOLD: 'sold',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type BeatStatus = (typeof BEAT_STATUS)[keyof typeof BEAT_STATUS];

export const VALID_STATUS_TRANSITIONS: Record<BeatStatus, BeatStatus[]> = {
  draft: ['pending_audio'],
  pending_audio: ['processing'],
  processing: ['ready'],
  ready: ['published'],
  published: ['sold', 'archived'],
  sold: ['archived'],
  archived: [],
  deleted: [],
};

const SORT_OPTIONS = {
  RECENT: 'recent',
  POPULAR: 'popular',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

// --- Input Schemas ---

export const CreateBeatInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priceCents: z.number().int().positive('Price must be greater than 0'),
  genre: z.string().optional(),
  bpm: z.number().int().positive().optional(),
  key: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateBeatInputSchema = z
  .object({
    title: z.string().min(1, 'Title cannot be empty'),
    description: z.string().optional(),
    priceCents: z.number().int().positive('Price must be greater than 0'),
    genre: z.string().optional(),
    bpm: z.number().int().positive().optional(),
    key: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum([
      BEAT_STATUS.DRAFT,
      BEAT_STATUS.PENDING_AUDIO,
      BEAT_STATUS.PROCESSING,
      BEAT_STATUS.READY,
      BEAT_STATUS.PUBLISHED,
      BEAT_STATUS.SOLD,
      BEAT_STATUS.ARCHIVED,
      BEAT_STATUS.DELETED,
    ]),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const ListBeatsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  genre: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  bpmMin: z.coerce.number().int().positive().optional(),
  bpmMax: z.coerce.number().int().positive().optional(),
  key: z.string().optional(),
  q: z.string().optional(),
  sort: z
    .enum([
      SORT_OPTIONS.RECENT,
      SORT_OPTIONS.POPULAR,
      SORT_OPTIONS.PRICE_ASC,
      SORT_OPTIONS.PRICE_DESC,
    ])
    .default(SORT_OPTIONS.RECENT),
});

// --- TypeScript Types ---

export type CreateBeatInput = z.infer<typeof CreateBeatInputSchema>;
export type UpdateBeatInput = z.infer<typeof UpdateBeatInputSchema>;
export type ListBeatsQuery = z.infer<typeof ListBeatsQuerySchema>;

export interface Beat {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  priceCents: number;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  tags: string[];
  audioUrl: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
  streamUrl: string | null;
  playsCount: number;
  salesCount: number;
  status: BeatStatus;
  publishedAt: Date | null;
  deletedAt: Date | null;
  producerId: string;
  buyerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  next: number | null;
  prev: number | null;
}

export interface PaginatedBeats {
  data: Beat[];
  pagination: PaginationMeta;
}

export interface ProducerStats {
  totalBeats: number;
  totalPlays: number;
  totalSales: number;
  revenue: number;
}

export interface GenreRecord {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}
