import React, { useEffect, useCallback, useState } from 'react';
import styles from './UploadDropZone.module.css';

function UploadDropZone({ onFilesSelected, session, glassy = false }) {
  const [isDragging, setIsDragging] = useState(false);

  // ✅ Safe handler for file input
  const handleFileChange = (e) => {
    const inputFiles = Array.from(e?.target?.files || []);
    const audioFiles = inputFiles.filter(file => file.type.startsWith('audio/'));

    if (!session?.user?.id) {
      alert('Session not ready. Please reload.');
      return;
    }

    if (audioFiles.length === 0) {
      alert('No valid audio files selected.');
      return;
    }

    onFilesSelected(audioFiles);

    // ✅ Safely clear input value to allow same file again
    if (e?.target?.value !== undefined) {
      e.target.value = null;
    }
  };

  // ✅ Drop support
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    const audioFiles = droppedFiles.filter(f => f.type.startsWith('audio/'));

    if (audioFiles.length === 0) {
      alert('No valid audio files found in selection.');
      return;
    }

    onFilesSelected(audioFiles);
  }, [onFilesSelected]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // ✅ Setup drop event bindings
  useEffect(() => {
    const dropArea = document.getElementById('drop-zone');
    if (!dropArea) return;

    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);

    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, [handleDrop]);

  // ✅ Trigger input click from container
  const openFilePicker = () => {
    const input = document.getElementById('fileInput');
    if (input) input.click();
  };

  return (
    <div
      id="drop-zone"
      className={`${styles.dropZone} ${isDragging ? styles.dragOver : ''} ${glassy ? styles.glassy : ''}`}
      role="button"
      tabIndex={0}
      onClick={openFilePicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') openFilePicker();
      }}
    >
      <div className={styles.content}>
        <h2 className={styles.title}>Upload Audio to Your Vault</h2>
        <svg
          className={`${styles.uploadIcon} ${isDragging ? styles.bounce : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 3a1 1 0 0 1 1 1v8.17l2.88-2.88a1 1 0 1 1 1.41 1.41l-4.59 4.59a1 1 0 0 1-1.41 0l-4.59-4.59a1 1 0 1 1 1.41-1.41L11 12.17V4a1 1 0 0 1 1-1Zm-7 15a1 1 0 0 1 0 2h14a1 1 0 1 1 0-2H5Z"
          />
        </svg>
        <p className={styles.subtext}>Drag & Drop Files</p>
        <p className={styles.or}>or</p>
        <p className={styles.clickToUpload}>Click to Upload</p>
        <input
          id="fileInput"
          key={Date.now()}
          type="file"
          multiple
          accept=".wav,.mp3"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default UploadDropZone;
