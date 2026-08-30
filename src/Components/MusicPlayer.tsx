import React, { useState, useRef, useEffect } from 'react';
import './MusicPlayer.css';

interface Track {
  id: string;
  title: string;
  artist: string;
  file: string;
}

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wasPlayingRef = useRef(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.3); // Start at 30% volume
  const [showPlayer, setShowPlayer] = useState(false);

  // Add your music tracks here
  const tracks: Track[] = [
    {
      id: '1',
      title: 'Golden Brown Instruental',
      artist: 'Mattip-music',
      file: '/audio/Golden Brown V2.mp3'
    },
    {
      id: '2',
      title: 'Nice 2 Know Ya Instrumental (Slowed & Reverbed)',
      artist: 'Sylendanna',
      file: '/audio/34. Sylendanna - Nice 2 Know Ya Instrumental (Slowed & Reverbed).mp3'
    },
    {
      id: '3',
      title: 'Missing Life',
      artist: 'Background Music',
      file: '/audio/gabriawll, QKReign - Missing Life [NCS Release].mp3'
    }
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;

      // Sync state with actual audio element
      const audio = audioRef.current;
      const updatePlayingState = () => {
        setIsPlaying(!audio.paused);
      };

      audio.addEventListener('play', updatePlayingState);
      audio.addEventListener('pause', updatePlayingState);

      return () => {
        audio.removeEventListener('play', updatePlayingState);
        audio.removeEventListener('pause', updatePlayingState);
      };
    }
  }, [volume]);

  // Separate effect for initial setup
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      // Set initial state based on audio element
      setIsPlaying(!audio.paused);
    }
  }, []);

  // Handle track changes while preserving play state
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      // Load the new track
      audio.load();

      // If music was playing before track change, start the new track
      if (wasPlayingRef.current) {
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(console.error);
        }
      }
    }
  }, [currentTrack]);

  // Dismiss on a click anywhere else, the way a popover should behave.
  //
  // The toggle button has to be excluded as well as the panel: it sits outside
  // the panel, so a click on it would otherwise be handled here first and close
  // the player, and its own onClick would then immediately reopen it — leaving
  // the button looking dead.
  useEffect(() => {
    if (!showPlayer) return;

    const handlePointerDown = (event: Event) => {
      const target = event.target as Node;
      if (playerRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setShowPlayer(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowPlayer(false);
    };

    // mousedown rather than click so the panel closes as soon as the press
    // lands; touchstart because a tap does not always emulate mousedown first.
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showPlayer]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play()
          .catch((error) => {
            console.error('Failed to play audio:', error);
            // Try to reload the audio element
            audioRef.current?.load();
          });
      }
      // Remove manual state setting - let the audio events handle it
    }
  };

  // Wraps in both directions, so the buttons are never dead ends.
  const changeTrack = (offset: number) => {
    // Store current playing state before changing tracks
    wasPlayingRef.current = isPlaying;
    const count = tracks.length;
    setCurrentTrack((current) => (current + offset + count) % count);
    // Track change playback is handled in useEffect
  };

  const nextTrack = () => changeTrack(1);

  const prevTrack = () => {
    // Standard music-player behaviour: once you're a few seconds into a track,
    // "previous" means "start this one over" rather than skipping backwards.
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    changeTrack(-1);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleAudioEnd = () => {
    nextTrack();
  };

  if (tracks.length === 0) {
    return null; // Don't show player if no tracks
  }

  return (
    <>
      {/* Music toggle button */}
      <div className="music-toggle-container" ref={toggleRef}>
        <button
          className="music-toggle-btn"
          onClick={() => setShowPlayer(!showPlayer)}
          title={showPlayer ? 'Hide music player' : 'Show music player'}
          aria-label={showPlayer ? 'Hide music player' : 'Show music player'}
          aria-expanded={showPlayer}
        >
          🎵
        </button>

        {/* Mini play/pause button when player is minimized */}
        {!showPlayer && (
          <button
            className="music-mini-control"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <div className="pause-icon">
                <span></span>
                <span></span>
              </div>
            ) : (
              <div className="play-icon"></div>
            )}
          </button>
        )}
      </div>

      {/* Music player panel */}
      {showPlayer && (
        <div
          className="music-player"
          ref={playerRef}
          role="dialog"
          aria-label="Background music player"
        >
          <div className="music-player-header">
            <span className="music-title">🎶 Background Music</span>
            <button
              className="music-close-btn"
              onClick={() => setShowPlayer(false)}
            >
              ×
            </button>
          </div>

          <div className="music-info">
            <div className="track-title">{tracks[currentTrack].title}</div>
            <div className="track-artist">{tracks[currentTrack].artist}</div>
            <div className="track-position">
              Track {currentTrack + 1} of {tracks.length}
            </div>
          </div>

          <div className="music-controls">
            <button
              className="music-btn secondary"
              onClick={prevTrack}
              title="Previous track"
              aria-label="Previous track"
            >
              <div className="prev-icon">
                <span></span>
                <div className="play-icon"></div>
              </div>
            </button>

            <button
              className="music-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <div className="pause-icon">
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div className="play-icon"></div>
              )}
            </button>

            <button
              className="music-btn secondary"
              onClick={nextTrack}
              title="Next track"
              aria-label="Next track"
            >
              <div className="next-icon">
                <div className="play-icon"></div>
                <span></span>
              </div>
            </button>
          </div>

          <div className="volume-control">
            <span aria-hidden="true">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              aria-label="Volume"
            />
          </div>

        </div>
      )}

      {/* Audio element - always present so music doesn't stop */}
      <audio
        ref={audioRef}
        src={tracks[currentTrack].file}
        onEnded={handleAudioEnd}
      />
    </>
  );
};

export default MusicPlayer;