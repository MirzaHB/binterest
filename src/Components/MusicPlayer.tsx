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
    }
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = true; // Loop the current track
    }
  }, [volume]);

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
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    const next = (currentTrack + 1) % tracks.length;
    setCurrentTrack(next);
    if (isPlaying && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(console.error);
    }
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
      <button
        className="music-toggle-btn"
        onClick={() => setShowPlayer(!showPlayer)}
        title="Background Music"
      >
        🎵
      </button>

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

          <audio
            ref={audioRef}
            src={tracks[currentTrack].file}
            onEnded={handleAudioEnd}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>
      )}
    </>
  );
};

export default MusicPlayer;