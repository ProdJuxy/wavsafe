// RealWaveform.jsx
import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

function RealWaveform({ audioUrl, playing, progress }) {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#5a189a',
      progressColor: '#ff00aa',
      height: 30,
      barWidth: 1,
      barHeight: 0.9,        // 🎯 controls how tall the bars are relative to container height
      autoCenter: true,      // 🎯 this is critical: centers waveform vertically
      responsive: true,
      cursorWidth: 2,
      cursorColor: '#ffffff',
      normalize: true,       // normalizes loudness visually
      partialRender: true,   // speeds up rendering
      backend: 'WebAudio',
      interact: false,
    });

    wavesurfer.current.load(audioUrl);

    return () => {
      wavesurfer.current.destroy();
    };
  }, [audioUrl]);

  useEffect(() => {
    if (wavesurfer.current && typeof progress === 'number') {
      wavesurfer.current.seekTo(progress / 100);
    }
  }, [progress]);

  return (
    <div
      ref={waveformRef}
      style={{
        width: '100%',
        height: '30px',
        marginTop: '0.25rem',
        backgroundColor: '#111',
        borderRadius: '8px',
        overflow: 'hidden', 
        opacity: 1,
        transition: 'opacity 0.5s ease',
      }}
    />
  );
}

export default RealWaveform;
