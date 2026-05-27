import { ACTIVITY_TYPE, type ActivityItem } from '../../domain/marketplace/ActivityItem';
import type { Beat } from '../../domain/marketplace/Beat';
import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { Release } from '../../domain/marketplace/Release';

const delay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600));
};

const BEATS: Beat[] = [
  {
    id: 'beat-ancestral-pulse',
    title: 'Ancestral Pulse',
    artist: 'KOGUI VIBES',
    genre: 'CUMBIA',
    genreColor: '#C8860A',
    price: 29_999,
    coverUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'beat-gold-dust-riddim',
    title: 'Gold Dust Riddim',
    artist: 'TIERRA SANTA',
    genre: 'AFROBEAT',
    genreColor: '#1A7A6E',
    price: 34_999,
    coverUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'beat-tierra-santa',
    title: 'Tierra Santa',
    artist: 'EMBERA BEATS',
    genre: 'CHAMPETA',
    genreColor: '#B5651D',
    price: 45_000,
    coverUrl: '',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'activity-new-beat',
    type: ACTIVITY_TYPE.NEW_BEAT,
    title: 'Nuevo Beat',
    description: 'Kogui Vibes acaba de subir 3 beats nuevos a su catálogo.',
    color: '#1A7A6E',
    icon: 'queue_music',
  },
  {
    id: 'activity-trending',
    type: ACTIVITY_TYPE.TRENDING,
    title: 'Trending Alert',
    description: 'Tierra Santa lleva 48h en el top de ventas.',
    color: '#C8860A',
    icon: 'trending_up',
  },
  {
    id: 'activity-offer',
    type: ACTIVITY_TYPE.OFFER,
    title: 'Oferta Exclusiva',
    description: 'Gold Dust Riddim tiene 20% de descuento por tiempo limitado.',
    color: '#8B2500',
    icon: 'sell',
  },
  {
    id: 'activity-recommended',
    type: ACTIVITY_TYPE.RECOMMENDED,
    title: 'Recomendado',
    description: 'Basado en tus compras: Jaguar Sun de Embera Drum.',
    color: '#B5651D',
    icon: 'auto_awesome',
  },
];

const RELEASES: Release[] = [
  {
    id: 'release-jaguar-sun',
    title: 'Jaguar Sun',
    artist: 'Embera Drum',
    coverUrl: '',
    availableInDays: 2,
  },
  {
    id: 'release-sierra-nevada-flow',
    title: 'Sierra Nevada Flow',
    artist: 'Tayrona Beats',
    coverUrl: '',
    availableInDays: 5,
  },
];

export class MockMarketplaceRepository implements MarketplaceRepository {
  async getBeats(): Promise<Beat[]> {
    await delay();
    return structuredClone(BEATS);
  }

  async getActivities(): Promise<ActivityItem[]> {
    await delay();
    return structuredClone(ACTIVITIES);
  }

  async getUpcomingReleases(): Promise<Release[]> {
    await delay();
    return structuredClone(RELEASES);
  }
}
