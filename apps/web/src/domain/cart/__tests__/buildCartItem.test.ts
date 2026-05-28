import { describe, expect, it } from 'vitest';
import { buildCartItem } from '../buildCartItem';
import type { Beat } from '../../marketplace/Beat';

const mockBeat: Beat = {
  id: 'beat-42',
  title: 'Cumbia del Río',
  artist: 'DJ Tairona',
  genre: 'Cumbia',
  genreColor: '#FF5733',
  price: 29,
  coverUrl: 'https://example.com/cover.jpg',
  audioUrl: 'https://example.com/audio.mp3',
};

describe('buildCartItem', () => {
  it('maps Beat fields to CartItem with the supplied licenseType', () => {
    const result = buildCartItem(mockBeat, 'raiz');

    expect(result.id).toBe('item-beat-42');
    expect(result.beatId).toBe('beat-42');
    expect(result.beatTitle).toBe('Cumbia del Río');
    expect(result.producerName).toBe('DJ Tairona');
    expect(result.coverUrl).toBe('https://example.com/cover.jpg');
    expect(result.price).toBe(29);
    expect(result.licenseType).toBe('raiz');
    expect(result.quantity).toBe(1);
  });

  it('defaults quantity to 1 regardless of input', () => {
    const result = buildCartItem(mockBeat, 'semilla');

    expect(result.quantity).toBe(1);
  });

  it('preserves licenseType for ceiba plan', () => {
    const result = buildCartItem(mockBeat, 'ceiba');

    expect(result.licenseType).toBe('ceiba');
    expect(result.price).toBe(29);
  });
});
