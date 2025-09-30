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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.3); // Start at 30% volume
  const [showPlayer, setShowPlayer] = useState(false);

  // Add your music tracks here
  const tracks: Track[] = [
    {
      id: '1',
      title: 'Soft Inspiring Corporate',
      artist: 'Background Music',
      file: '/audio/soft-inspiring-corporate-background-music-409687.mp3'
    },
      {
      id: '2',
      title: 'Golden Brown Instruental',
      artist: 'Mattip-music',
      file: '/audio/Golden Brown V2.mp3'
    }
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true; // Loop the current track

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

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        console.log('Music paused');
      } else {
        console.log('Attempting to play:', tracks[currentTrack].file);
        audioRef.current.play()
          .then(() => console.log('Music started playing'))
          .catch((error) => {
            console.error('Failed to play audio:', error);
            // Try to reload the audio element
            audioRef.current?.load();
          });
      }
      // Remove manual state setting - let the audio events handle it
    }
  };

  const nextTrack = () => {
    // Store current playing state before changing tracks
    wasPlayingRef.current = isPlaying;
    const next = (currentTrack + 1) % tracks.length;
    setCurrentTrack(next);
    // Track change playback is handled in useEffect
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
      <div className="music-toggle-container">
        <button
          className="music-toggle-btn"
          onClick={() => setShowPlayer(!showPlayer)}
          title="Background Music"
        >
          🎵
        </button>

        {/* Mini play/pause button when player is minimized */}
        {!showPlayer && (
          <button
            className="music-mini-control"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Mini control clicked, current isPlaying:', isPlaying);
              togglePlay();
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        )}
      </div>

      {/* Music player panel */}
      {showPlayer && (
        <div className="music-player">
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
          </div>

          <div className="music-controls">
            <button
              className="music-btn"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              className="music-btn"
              onClick={nextTrack}
              title="Next Track"
            >
              ⏭️
            </button>
          </div>

          <div className="volume-control">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
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