import { describe, it, expect } from 'vitest';
import {
  CreateBeatInputSchema,
  UpdateBeatInputSchema,
  ListBeatsQuerySchema,
} from '@/modules/beats/types.js';

describe('CreateBeatInputSchema', () => {
  it('should accept valid beat metadata', () => {
    const input = {
      title: 'Dark Trap Beat',
      description: 'Hard-hitting 808s',
      priceCents: 2999,
    };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Dark Trap Beat');
      expect(result.data.priceCents).toBe(2999);
    }
  });

  it('should accept input without description', () => {
    const input = { title: 'Boom Bap', priceCents: 1999 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it('should accept input with all optional fields', () => {
    const input = {
      title: 'Trap Beat',
      priceCents: 2500,
      genre: 'Trap',
      bpm: 140,
      key: 'Cm',
      tags: ['dark', '808'],
    };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.genre).toBe('Trap');
      expect(result.data.bpm).toBe(140);
      expect(result.data.key).toBe('Cm');
      expect(result.data.tags).toEqual(['dark', '808']);
    }
  });

  it('should reject missing title', () => {
    const input = { priceCents: 1999 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const input = { title: '', priceCents: 1999 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject negative priceCents', () => {
    const input = { title: 'Beat', priceCents: -5 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject non-integer priceCents', () => {
    const input = { title: 'Beat', priceCents: 19.99 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing priceCents', () => {
    const input = { title: 'Beat' };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('UpdateBeatInputSchema', () => {
  it('should accept partial updates with title only', () => {
    const input = { title: 'Updated Title' };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept partial updates with priceCents only', () => {
    const input = { priceCents: 4999 };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept status update', () => {
    const input = { status: 'published' };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept genre, bpm, key, tags updates', () => {
    const input = { genre: 'Boom Bap', bpm: 90, key: 'Fm', tags: ['old-school'] };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject empty body', () => {
    const result = UpdateBeatInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject negative priceCents in update', () => {
    const input = { priceCents: -1 };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid status value', () => {
    const input = { status: 'invalid-status' };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('ListBeatsQuerySchema', () => {
  it('should parse with defaults', () => {
    const result = ListBeatsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe('recent');
    }
  });

  it('should parse all filter params', () => {
    const input = {
      page: '2',
      limit: '10',
      genre: 'Trap',
      minPrice: '1000',
      maxPrice: '5000',
      bpmMin: '120',
      bpmMax: '160',
      key: 'Cm',
      q: 'dark',
      sort: 'popular',
    };
    const result = ListBeatsQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
      expect(result.data.genre).toBe('Trap');
      expect(result.data.minPrice).toBe(1000);
      expect(result.data.maxPrice).toBe(5000);
      expect(result.data.bpmMin).toBe(120);
      expect(result.data.bpmMax).toBe(160);
      expect(result.data.key).toBe('Cm');
      expect(result.data.q).toBe('dark');
      expect(result.data.sort).toBe('popular');
    }
  });

  it('should reject limit over 100', () => {
    const result = ListBeatsQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid sort option', () => {
    const result = ListBeatsQuerySchema.safeParse({ sort: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject negative page', () => {
    const result = ListBeatsQuerySchema.safeParse({ page: '-1' });
    expect(result.success).toBe(false);
  });
});
