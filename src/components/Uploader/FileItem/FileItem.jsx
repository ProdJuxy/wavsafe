// components/Uploader/FileItem/FileItem.jsx

import styles from './FileItem.module.css';
import { FaPlay, FaPause, FaTrashAlt, FaHashtag } from 'react-icons/fa';
import { getTagColor } from '../constants/tagColors';

function FileItem({
  file,
  meta,
  isPlaying,
  isSelected,
  editing,
  editingTags,
  showConfirm,
  onTogglePlay,
  onToggleSelect,
  onStartEdit,
  onSaveTags,
  onSetEditingTags,
  onDeleteConfirm,
  onDeleteCancel,
  onDelete,
}) {
  const fileName = meta?.original_name || file.name;

  return (
    <li className={`${styles.item} ${isPlaying ? styles.nowPlaying : ''}`}>
      <div className={styles.leftGroup}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(file.name)}
        />

        <button
          className={styles.playButton}
          onClick={onTogglePlay}
        >
          {isPlaying ? <FaPause size={12} color="#fff" /> : <FaPlay size={12} color="#fff" />}
        </button>

        <span className={styles.fileName}>
          {fileName}
        </span>

        {/* Tags */}
        {(meta.tags || []).map(tag => (
          <span
            key={tag}
            className={styles.tag}
            style={{ backgroundColor: getTagColor(tag) }}
          >
            #{tag}
          </span>
        ))}

        {/* Edit Button */}
        <button
          className={styles.editButton}
          onClick={onStartEdit}
        >
          <FaHashtag size={12} color="#fff" />
        </button>
      </div>

      {/* Right-side metadata */}
      <div className={styles.rightGroup}>
        <span>{meta.duration ? `${meta.duration.toFixed(1)}s` : '...'}</span>
        <span>{meta.size ? `${meta.size} MB` : '...'}</span>
        <span>{meta.date || '...'}</span>
      </div>

      {/* Tag Editing UI */}
      {editing && (
        <div className={styles.tagEditor}>
          <input
            value={editingTags}
            onChange={(e) => onSetEditingTags(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveTags();
            }}
            onBlur={onSaveTags}
            placeholder="Enter tags separated by commas"
          />
        </div>
      )}

      {/* Delete Confirm UI */}
        <div className={styles.trashWrapper}>
        <button className={styles.trashButton} onClick={onDeleteConfirm}>
            <FaTrashAlt size={14} />
        </button>

        {showConfirm && (
            <div className={styles.confirmPopup}>
            <p>Are you sure you want to delete?</p>
            <div className={styles.confirmActions}>
                <button onClick={onDelete}>Delete</button>
                <button onClick={onDeleteCancel}>Cancel</button>
            </div>
            </div>
        )}
        </div>

    </li>
  );
}

export default FileItem;
