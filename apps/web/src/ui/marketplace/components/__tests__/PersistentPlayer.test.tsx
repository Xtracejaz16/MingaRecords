import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PersistentPlayer } from '../PersistentPlayer';
import { usePlayerStore } from '../../store/playerStore';
import type { Beat } from '../../../../domain/marketplace/Beat';

// Module-level mock functions for assertion in tests
const mockSeek = vi.fn();
const mockSetVolume = vi.fn();

vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({
    playBeat: vi.fn(),
    seek: mockSeek,
    setVolume: mockSetVolume,
    toggleMute: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
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
    vi.clearAllMocks();
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

  it('calls seek with correct position on progress bar click', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat });
    render(<PersistentPlayer />);

    const progressBar = screen.getByTestId('progress-bar');
    // Mock getBoundingClientRect to return a 200px wide bar at x=0
    vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 200, height: 8, top: 0, right: 200, bottom: 8, left: 0,
    } as DOMRect);

    // Click at x=100 (50% of width) → seek(50% of duration=100) = seek(50)
    fireEvent.click(progressBar, { clientX: 100 });

    expect(mockSeek).toHaveBeenCalledWith(50);
  });

  it('calls setVolume with correct percent on volume bar click', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat });
    render(<PersistentPlayer />);

    const volumeBar = screen.getByTestId('volume-bar');
    vi.spyOn(volumeBar, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 200, height: 8, top: 0, right: 200, bottom: 8, left: 0,
    } as DOMRect);

    // Click at x=150 (75% of width) → setVolume(75)
    fireEvent.click(volumeBar, { clientX: 150 });

    expect(mockSetVolume).toHaveBeenCalledWith(75);
  });

  it('calls setVolume during volume thumb drag', () => {
    usePlayerStore.setState({ currentBeat: sampleBeat });
    render(<PersistentPlayer />);

    const volumeBar = screen.getByTestId('volume-bar');
    vi.spyOn(volumeBar, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, width: 200, height: 8, top: 0, right: 200, bottom: 8, left: 0,
    } as DOMRect);

    // Find the volume thumb and start dragging
    const volumeThumb = screen.getByTestId('volume-thumb');
    fireEvent.mouseDown(volumeThumb);

    // Drag to x=120 (60% of width)
    fireEvent.mouseMove(document, { clientX: 120 });

    expect(mockSetVolume).toHaveBeenCalledWith(60);

    // Release mouse
    fireEvent.mouseUp(document);
  });
});
