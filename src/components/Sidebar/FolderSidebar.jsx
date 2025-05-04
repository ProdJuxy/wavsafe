import styles from './FolderSidebar.module.css';

export default function FolderSidebar({ currentView, onSelect }) {
  const sections = [
    { id: 'all', label: 'All Files', icon: '🗃' },
    { id: 'loops', label: 'Loop Bank', icon: '🔁' },
    { id: 'samples', label: 'Sample Stash', icon: '🥁' },
    { id: 'beats', label: 'Beats', icon: '?' },
    { id: 'folders', label: 'Folders', icon: '📁' },
  ];

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.title}></h2>
      <ul className={styles.navList}>
        {sections.map((section) => (
          <li
            key={section.id}
            className={`${styles.navItem} ${currentView === section.id ? styles.active : ''}`}
            onClick={() => onSelect(section.id)}
          >
            <span className={styles.icon}>{section.icon}</span>
            <span>{section.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
