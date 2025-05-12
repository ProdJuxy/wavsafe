import React from 'react';
import styles from './MobileView.module.css';
import { FaPlay, FaPause, FaHashtag } from 'react-icons/fa';

function MobileFileCard({ file, onPlay, isPlaying }) {
  const handleCardClick = () => {
    onPlay(file);
  };

  return (
    <div className={styles.fileItem} onClick={handleCardClick}>
      <div className={styles.topRow}>
        <div className={styles.metaLeft}>
          <div className={styles.fileName}>{file.name}</div>
        </div>

        <div className={styles.metaRight}>
          {file.duration && <span>{file.duration}s</span>}
          {file.size && <span>{file.size}MB</span>}
        </div>

        <button
          className={styles.playButton}
          onClick={(e) => {
            e.stopPropagation(); // prevent parent click from also firing
            onPlay(file);
          }}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>

      {file.tags?.length > 0 && (
        <div className={styles.tags}>
          {file.tags.map((tag, i) => (
            <span className={styles.tag} key={i}>
              <FaHashtag />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MobileFileCard;
