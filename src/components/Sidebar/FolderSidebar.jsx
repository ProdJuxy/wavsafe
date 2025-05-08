import styles from './FolderSidebar.module.css';
import { useState } from 'react';
import { useSidebar } from '../../context/SidebarContext';

export default function FolderSidebar({
  currentView,
  onSelect,
  folders = [],
  newFolderName,
  setNewFolderName,
  createFolder,
  deleteFolder,
  renameFolder,
  onAssignSelectedToFolder,
}) {
  const staticSections = [
    { id: 'all', label: 'All Files', icon: '🗃' },
    { id: 'loops', label: 'Loop Bank', icon: '🔁' },
    { id: 'samples', label: 'Sample Stash', icon: '🥁' },
    { id: 'beats', label: 'Beats', icon: '🎶' },
  ];

  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState();

  const handleRenameSubmit = (folderId) => {
    if (editingName.trim()) {
      renameFolder(folderId, editingName);
      setEditingFolderId(null);
      setEditingName('');
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>

      <button
        className={styles.collapseToggle}
        onClick={() => setIsCollapsed(prev => !prev)}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? '➡️' : '⬅️'}
      </button>


      <ul className={styles.navList}>
        {staticSections.map((section) => (
          <li
            key={section.id}
            className={`${styles.navItem} ${currentView === section.id ? styles.active : ''}`}
            onClick={() => onSelect(section.id)}
          >
            <span className={styles.icon}>{section.icon}</span>
            <span>{section.label}</span>
          </li>
        ))}

        <li className={styles.navHeader}>📁 Folders</li>

        {folders.map((folder) => (
          <li key={folder.id} className={`${styles.navItem} ${currentView === folder.id ? styles.active : ''}`}>
          {editingFolderId === folder.id ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameSubmit(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(folder.id);
                if (e.key === 'Escape') {
                  setEditingFolderId(null);
                  setEditingName('');
                }
              }}
              autoFocus
              className={styles.renameInput}
            />
          ) : (
            <>
              <span className={styles.folderName} onClick={() => onSelect(folder.id)}>
                {folder.name}
              </span>
              <div className={styles.iconGroup}>
                <button className={styles.iconBtn} onClick={() => renameFolder(folder.id)}>✏️</button>
                <button className={styles.iconBtn} onClick={() => deleteFolder(folder.id)}>🗑</button>
                <button className={styles.iconBtn} onClick={() => onAssignSelectedToFolder(folder.id)}>📥</button>
              </div>
            </>
          )}
        </li>
        
        ))}
      </ul>

      <div className={styles.newFolder}>
        <input
          type="text"
          placeholder="New Folder Name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <button
          onClick={createFolder}
          className={styles.addFolderBtn}
          title="Add Folder"
          aria-label="Add Folder"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 1V15M1 8H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
