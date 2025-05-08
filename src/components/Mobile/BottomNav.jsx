import React from 'react';
import styles from './MobileView.module.css';
import { FaFolder, FaPlus, FaCog } from 'react-icons/fa';

function BottomNav({ setCurrentView, handleUpload }) {
  return (
    <div className={styles.bottomNav}>
      <button onClick={() => setCurrentView('folders')}>
        <FaFolder />
        <span>Folders</span>
      </button>
      <button onClick={handleUpload}>
        <FaPlus />
        <span>Upload</span>
      </button>
      <button onClick={() => setCurrentView('settings')}>
        <FaCog />
        <span>Settings</span>
      </button>
    </div>
  );
}

export default BottomNav;
