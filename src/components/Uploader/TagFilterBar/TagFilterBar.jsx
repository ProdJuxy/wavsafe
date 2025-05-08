// components/Uploader/TagFilterBar/TagFilterBar.jsx

import styles from './TagFilterBar.module.css';
import { getTagColor, adjustBrightness } from '../constants/tagColors';

function TagFilterBar({ metadata, activeTagFilter, setActiveTagFilter }) {
  const allTags = Array.from(new Set(Object.values(metadata).flatMap(m => m.tags || [])));

  return (
    <div className={styles.wrapper}>
      {allTags.map(tag => {
        const baseColor = getTagColor(tag);
        const activeColor = adjustBrightness(baseColor, 20);
        const isActive = activeTagFilter === tag;

        return (
          <button
            key={tag}
            onClick={() => setActiveTagFilter(isActive ? null : tag)}
            className={`${styles.tagButton} ${isActive ? styles.activeTag : ''}`}
            style={{
              borderColor: baseColor,
              backgroundColor: isActive ? activeColor : 'transparent',
              color: isActive ? '#ffffff' : baseColor,
            }}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
}

export default TagFilterBar;
