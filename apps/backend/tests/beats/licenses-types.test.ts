import { describe, it, expect } from 'vitest';
import { PRICE_RANGES, validateLicensePrice } from '@/modules/beats/types.js';

describe('PRICE_RANGES', () => {
  it('should define ranges for BASIC, PREMIUM, EXCLUSIVE', () => {
    expect(PRICE_RANGES).toBeDefined();
    expect(PRICE_RANGES.BASIC).toBeDefined();
    expect(PRICE_RANGES.PREMIUM).toBeDefined();
    expect(PRICE_RANGES.EXCLUSIVE).toBeDefined();
  });

  it('should have minCents less than or equal to maxCents for all types', () => {
    for (const range of Object.values(PRICE_RANGES)) {
      expect(range.minCents).toBeLessThanOrEqual(range.maxCents);
    }
  });

  it('should set BASIC range from 100 to 5000 cents', () => {
    expect(PRICE_RANGES.BASIC.minCents).toBe(100);
    expect(PRICE_RANGES.BASIC.maxCents).toBe(5000);
  });

  it('should set PREMIUM range from 2000 to 20000 cents', () => {
    expect(PRICE_RANGES.PREMIUM.minCents).toBe(2000);
    expect(PRICE_RANGES.PREMIUM.maxCents).toBe(20000);
  });

  it('should set EXCLUSIVE range from 10000 to 200000 cents', () => {
    expect(PRICE_RANGES.EXCLUSIVE.minCents).toBe(10000);
    expect(PRICE_RANGES.EXCLUSIVE.maxCents).toBe(200000);
  });
});

describe('validateLicensePrice', () => {
  it('should return null for valid BASIC price', () => {
    expect(validateLicensePrice('BASIC', 500)).toBeNull();
  });

  it('should return null for valid PREMIUM price', () => {
    expect(validateLicensePrice('PREMIUM', 10000)).toBeNull();
  });

  it('should return null for valid EXCLUSIVE price', () => {
    expect(validateLicensePrice('EXCLUSIVE', 50000)).toBeNull();
  });

  it('should return null for price at min boundary', () => {
    expect(validateLicensePrice('BASIC', 100)).toBeNull();
  });

  it('should return null for price at max boundary', () => {
    expect(validateLicensePrice('BASIC', 5000)).toBeNull();
  });

  it('should return error for price below BASIC minimum', () => {
    expect(validateLicensePrice('BASIC', 50)).toBe(
      'Price 50 is out of range for BASIC license. Must be between 100 and 5000 cents.',
    );
  });

  it('should return error for price above EXCLUSIVE maximum', () => {
    expect(validateLicensePrice('EXCLUSIVE', 300000)).toBe(
      'Price 300000 is out of range for EXCLUSIVE license. Must be between 10000 and 200000 cents.',
    );
  });

  it('should return error for price below PREMIUM minimum', () => {
    expect(validateLicensePrice('PREMIUM', 500)).toBe(
      'Price 500 is out of range for PREMIUM license. Must be between 2000 and 20000 cents.',
    );
  });

  it('should throw for unknown license type', () => {
    expect(() => validateLicensePrice('UNKNOWN' as any, 100)).toThrow('Unknown license type: UNKNOWN');
  });
});
