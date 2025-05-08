// components/Uploader/UploadProgressBar/UploadProgressBar.jsx

import styles from './UploadProgressBar.module.css';
import { formatTime } from '../utils/formatTime';

function UploadProgressBar({ uploading, uploadProgress, uploadComplete }) {
  if (!uploading && !uploadComplete) return null;

  return (
    <div className={styles.wrapper}>
      {uploading && (
        <>
          <p className={styles.text}>
            Uploading {uploadProgress.current} of {uploadProgress.total} files...
          </p>
          <div className={styles.barOuter}>
            <div
              className={styles.barInner}
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            />
          </div>
          {uploadProgress.estimatedRemaining !== undefined && (
            <p className={styles.estimate}>
              ~{formatTime(uploadProgress.estimatedRemaining)} remaining
            </p>
          )}
        </>
      )}

      {uploadComplete && (
        <p className={styles.completeText}>Upload complete ✅</p>
      )}
    </div>
  );
}

export default UploadProgressBar;
