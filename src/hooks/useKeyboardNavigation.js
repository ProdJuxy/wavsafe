import { useEffect } from 'react';

export default function useKeyboardNavigation({
    currentTrack,
    visibleFiles,
    metadata,
    getPublicUrl,
    setCurrentTrack,
    audioRef,
    setIsPlaying,
    setProgress,
    onCloseSticky,
  }) {
    useEffect(() => {
      const handleKeyDown = (e) => {
        const active = document.activeElement;
        if (active?.tagName?.toLowerCase() === 'input') return;
  
        const index = visibleFiles.findIndex(
          (f) => (metadata[f.name]?.original_name || f.name) === currentTrack?.name
        );
  
        const goToTrack = (newIndex) => {
          const file = visibleFiles[newIndex];
          if (!file) return;
          const meta = metadata[file.name];
          const url = getPublicUrl(file.path);
          setCurrentTrack({
            url,
            name: meta.original_name || file.name,
            tags: meta.tags || [],
            duration: meta.duration,
            size: meta.size,
            date: meta.date,
            autoplay: true,
            storagePath: file.path,
          });
        };
  
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            if (index > 0) goToTrack(index - 1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            if (index < visibleFiles.length - 1) goToTrack(index + 1);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            if (audioRef?.current) {
              audioRef.current.currentTime = 0;
              setProgress?.(0);
            }
            break;
          case ' ':
          case 'Spacebar': // for older browsers
            e.preventDefault();
            if (audioRef?.current) {
              if (audioRef.current.paused) {
                audioRef.current.play();
                setIsPlaying?.(true);
              } else {
                audioRef.current.pause();
                setIsPlaying?.(false);
              }
            }
            break;
          case 'Escape':
            e.preventDefault();
            onCloseSticky?.();
            break;
        }
      };
  
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
      currentTrack,
      visibleFiles,
      metadata,
      getPublicUrl,
      setCurrentTrack,
      audioRef,
      setIsPlaying,
      setProgress,
      onCloseSticky,
    ]);
  }
  
