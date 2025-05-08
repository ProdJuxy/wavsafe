export function formatTime(seconds) {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    }
    return `${Math.ceil(seconds)}s`;
  }
  