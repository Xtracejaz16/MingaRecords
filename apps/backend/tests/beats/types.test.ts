import { describe, it, expect } from 'vitest';
import { CreateBeatInputSchema, UpdateBeatInputSchema } from '@/modules/beats/types.js';

describe('CreateBeatInputSchema', () => {
  it('should accept valid beat metadata', () => {
    const input = {
      title: 'Dark Trap Beat',
      description: 'Hard-hitting 808s',
      price: 29.99,
    };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Dark Trap Beat');
      expect(result.data.price).toBe(29.99);
    }
  });

  it('should accept input without description', () => {
    const input = { title: 'Boom Bap', price: 19.99 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it('should reject missing title', () => {
    const input = { price: 19.99 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject empty title', () => {
    const input = { title: '', price: 19.99 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const input = { title: 'Beat', price: -5 };
    const result = CreateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing price', () => {
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

  it('should accept partial updates with price only', () => {
    const input = { price: 49.99 };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject empty body', () => {
    const result = UpdateBeatInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject negative price in update', () => {
    const input = { price: -1 };
    const result = UpdateBeatInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
