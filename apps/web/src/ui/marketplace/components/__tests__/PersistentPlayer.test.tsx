import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersistentPlayer } from '../PersistentPlayer';
import { usePlayerStore } from '../../store/playerStore';
import type { Beat } from '../../../../domain/marketplace/Beat';

vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({
    playBeat: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
  }),
}));

const sampleBeat: Beat = {
  id: 'beat-1',
  title: 'Test Beat',
  artist: 'Test Artist',
  genre: 'CUMBIA',
  genreColor: '#C8860A',
  price: 29_999,
  coverUrl: '',
  audioUrl: 'https://example.com/audio.mp3',
};

describe('PersistentPlayer', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentBeat: null,
      isPlaying: false,
      progress: 0,
      duration: 100,
      volume: 50,
      isMuted: false,
      status: 'idle',
    });
  });

  it('renders nothing when no current beat', () => {
    const { container } = render(<PersistentPlayer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders track info when beat is set', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat, isPlaying: false });
    render(<PersistentPlayer />);

    expect(screen.getByText('Test Beat')).toBeDefined();
    expect(screen.getByText('Test Artist')).toBeDefined();
  });

  it('shows play button when paused', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat, isPlaying: false });
    render(<PersistentPlayer />);

    expect(screen.getByText('play_arrow')).toBeDefined();
  });

  it('shows pause button when playing', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat, isPlaying: true });
    render(<PersistentPlayer />);

    expect(screen.getByText('pause')).toBeDefined();
  });

  it('shows volume_off icon when muted', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat, isMuted: true });
    render(<PersistentPlayer />);

    expect(screen.getByText('volume_off')).toBeDefined();
  });

  it('shows volume_up icon when not muted', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat, isMuted: false });
    render(<PersistentPlayer />);

    expect(screen.getByText('volume_up')).toBeDefined();
  });
});
