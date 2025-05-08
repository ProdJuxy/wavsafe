import React from 'react';
import styles from './DevSettingsPanel.module.css';

const DevSettingsPanel = ({ visible, onClose, options, setOptions }) => {
  if (!visible) return null;

  const handleToggle = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.panel}>
      <h3>🛠 Dev Settings</h3>

      <div className={styles.optionRow}>
        <label>Glassy Drop Zone</label>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={options.glassy}
            onChange={() => handleToggle('glassy')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <div className={styles.optionRow}>
        <label>Limit to 30 Files</label>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={options.limitTo30}
            onChange={() => handleToggle('limitTo30')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <div className={styles.optionRow}>
        <label>Force Dark Mode</label>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={options.darkModeOverride}
            onChange={() => handleToggle('darkModeOverride')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <div className={styles.optionRow}>
        <label>Debug Console</label>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={options.debugConsole}
            onChange={() => handleToggle('debugConsole')}
          />
          <span className={styles.slider}></span>
        </label>
      </div>

      <button className={styles.closeButton} onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default DevSettingsPanel;
