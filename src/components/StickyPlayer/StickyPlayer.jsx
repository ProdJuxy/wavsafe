import { useEffect, useRef, useState } from 'react';
import styles from './StickyPlayer.module.css';
import { FaPlay, FaPause, FaTimes, FaWaveSquare } from 'react-icons/fa';
import RealWaveform from '../RealWaveform/RealWaveform';
import { supabase } from '../../supabaseClient';

// Tag Colors (same as in Uploader)
const tagColors = {
  aggressive: '#8B0000',
  menacing: '#1C1C1C',
  gritty: '#3A3A3A',
  melancholic: '#4A5E6D',
  triumphant: '#FFD700',
  sinister: '#5B0060',
  hypnotic: '#6F00FF',
  anxious: '#AFFF33',
  rebellious: '#CC5500',
  cold: '#B0E0E6',
  vengeful: '#A30000',
  paranoid: '#2F4F4F',
  determined: '#4682B4',
  isolated: '#D3D3D3',
  chaotic: '#FF073A',
  epic: '#800080',
  evil: '#0B0B0B',
  demonic: '#660000',
  alien: '#00FFF7',
  possessed: '#2B0033',
  nostalgic: '#A67B5B',
  hopeful: '#A8E6CF',
  ominous: '#C70039',
  eerie: '#900C3F',
  creepy: '#581845',
  spooky: '#FFC300',
  haunting: '#DAF7A6',
  unsettling: '#FF5733',
  mysterious: '#900C3F',
  foreboding: '#581845',
  chilling: '#FFC300',
  suspenseful: '#C70039',
  thrilling: '#900C3F',
  murder: '#D50000',
  gloomy: '#626567',
  glitchy: '#2ECC71',
  dark: '#8e44ad',
  sad: '#3498db',
  happy: '#f1c40f',
  chill: '#1abc9c',
  energetic: '#e67e22',
  relaxed: '#2ecc71',
  Default: '#555',
};

const getTagColor = (tag) => {
  const normalized = tag.trim().toLowerCase();
  return tagColors[normalized] || tagColors.Default;
};

const StickyPlayer = ({ file, onClose, onNextTrack, onPrevTrack, setSelectedTrackIndex, onTagUpdate }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  const prevUrlRef = useRef(null);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = async () => {
    const cleaned = newTag.trim();
    if (!cleaned || file.tags.includes(cleaned)) {
      setNewTag('');
      setShowAddTag(false);
      return;
    }

    const updatedTags = [...file.tags, cleaned];
    const { error } = await supabase
      .from('files_metadata')
      .update({ tags: updatedTags })
      .eq('storage_path', file.storagePath);

    if (error) {
      console.error('❌ Failed to add tag:', error);
      return;
    }

    file.tags = updatedTags;
    setNewTag('');
    setShowAddTag(false);
    onTagUpdate?.(updatedTags);
  };

  // ✅ Define handleKeyDown outside useEffect
  const handleKeyDown = (e) => {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.code === 'Space') {
      e.preventDefault();
      handlePlayPause();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setProgress(0);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNextTrack?.();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onPrevTrack?.();
    }
  };

  useEffect(() => {
    if (!file?.url || !audioRef.current) return;

    const audio = audioRef.current;
    const isNewTrack = file.url !== prevUrlRef.current;
    prevUrlRef.current = file.url;

    if (isNewTrack) {
      audio.src = file.url;
      audio.load(); // 🧼 force reload

      if (file.autoplay) {
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.warn('Autoplay failed:', err));
      }
    }


    const handleCanPlay = () => {
      if (file.autoplay && isNewTrack) {
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    };

    const updateProgress = () => {
      const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      setProgress(isNaN(percent) ? 0 : percent);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [file, onNextTrack, onPrevTrack]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Playback error:', err));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (!file) return null;

  return (
    <div className={`${styles.playerWrapper} ${styles.selected}`}>
      <div className={styles.header}>
        <span className={styles.title}>{file.name || 'Untitled Audio'}</span>
        <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
      </div>

      <div className={styles.controls}>
        <button className={styles.playButton} onClick={handlePlayPause}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => {
            const newTime = (audioRef.current.duration * e.target.value) / 100;
            audioRef.current.currentTime = newTime;
            setProgress(e.target.value);
          }}
          className={`${styles.scrubBar} ${!isPlaying ? styles.scrubBarPaused : ''}`}
        />
        <button
          className={styles.waveformButton}
          onClick={() => setShowWaveform(prev => !prev)}
          title="Toggle Waveform"
        >
          <FaWaveSquare />
        </button>
        <audio ref={audioRef} hidden />
      </div>

      {file?.tags?.length > 0 && (
        <div className={styles.tags}>
          {file.tags.map(tag => (
            <span
              key={tag}
              className={styles.tag}
              style={{ backgroundColor: getTagColor(tag) }}
            >
              #{tag}
            </span>
          ))}
          {!showAddTag ? (
            <button
              className={styles.addTagButton}
              onClick={() => setShowAddTag(true)}
              style={{ backgroundColor: getTagColor('add') }}
              title="Add tag"
            >
              +
            </button>
          ) : (
            <input
              type="text"
              className={styles.addTagButtonInput}
              value={newTag}
              placeholder="tag"
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAddTag();
                } else if (e.key === 'Escape') {
                  setShowAddTag(false);
                  setNewTag('');
                }
              }}
              autoFocus
            />
          )}
        </div>
      )}

      {showWaveform && file?.url && (
        <div className={styles.waveform}>
          <RealWaveform audioUrl={file.url} playing={isPlaying} />
        </div>
      )}
    </div>
  );
};

export default StickyPlayer;
