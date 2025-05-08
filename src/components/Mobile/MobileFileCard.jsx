import React from 'react';
import styles from './MobileView.module.css';
import { FaPlay, FaPause, FaHashtag } from 'react-icons/fa';

function MobileFileCard({ file, onPlay, isPlaying }) {
  return (
    <div className={styles.fileItem}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{file.name}</strong>
        <button onClick={() => onPlay(file)}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>
      <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
        {file.duration} • {file.size}MB
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {file.tags?.map((tag, i) => (
          <span
            key={i}
            style={{
              backgroundColor: '#333',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FaHashtag />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default MobileFileCard;
