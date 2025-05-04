// =======================
// Imports
// =======================
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlay, FaPause, FaWaveSquare, FaHashtag, FaTrashAlt } from 'react-icons/fa';
import RealWaveform from '../RealWaveform/RealWaveform';
import styles from './Uploader.module.css';
import StickyPlayer from '../StickyPlayer/StickyPlayer';

// =======================
// Tag Color Mapping 🌈
// =======================
const tagColors = {
  aggressive: '#8B0000',
  menacing: '#1C1C1C',
  gritty: '#3A3A3A',
  melancholic: '#4A5E6D',
  triumphant: '#FFD700',
  sinister: '#5B0060',
  hypnotic: '#6F00FF',
  anxious: '#AFFF33',
  rebellious: '#CC5500',
  cold: '#B0E0E6',
  vengeful: '#A30000',
  paranoid: '#2F4F4F',
  determined: '#4682B4',
  isolated: '#D3D3D3',
  chaotic: '#FF073A',
  epic: '#800080',
  evil: '#0B0B0B',
  demonic: '#660000',
  alien: '#00FFF7',
  possessed: '#2B0033',

  nostalgic: '#A67B5B', hopeful: '#A8E6CF', 
  


  ominous: '#C70039', eerie: '#900C3F', creepy: '#581845',
  spooky: '#FFC300', haunting: '#DAF7A6', unsettling: '#FF5733', 
  mysterious: '#900C3F', foreboding: '#581845', chilling: '#FFC300', suspenseful: '#C70039', thrilling: '#900C3F',


  murder: '#D50000', gloomy: '#626567', glitchy: '#2ECC71',
  dark: '#8e44ad', sad: '#3498db', happy: '#f1c40f', chill: '#1abc9c', energetic: '#e67e22',
  relaxed: '#2ecc71', Default: '#555'
   
};

// =======================
// Adjust Color Brightness  
// =======================
const adjustBrightness = (hex, percent) => {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));
  return `rgb(${r}, ${g}, ${b})`;
};

// =======================
// Normalize Tag Lookup
// =======================
const getTagColor = (tag) => {
  const normalizedTag = tag.trim().toLowerCase();
  const found = Object.keys(tagColors).find(key => key.toLowerCase() === normalizedTag);
  return found ? tagColors[found] : tagColors.Default;
};

// =======================
// Uploader Component
// =======================
function Uploader({ session }) {
  // =======================
  // State Management
  // =======================
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [playingIndex, setPlayingIndex] = useState(null);
  const [progress, setProgress] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTags, setEditingTags] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [poofingIndex, setPoofingIndex] = useState(null);
  const audioRefs = useRef([]);
  const currentAudioRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null); // info for sticky player
  const [showStickyPlayer, setShowStickyPlayer] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(null);
  const startTime = Date.now();
  

  // =======================
  // File Upload Change Handler
  // =======================
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
  
    console.log('Tapped file input changed:', files);
    console.log('Filtered audio files:', audioFiles);
  
    if (!session?.user?.id) {
      console.error('❌ Session not ready');
      alert('Session not ready. Please reload.');
      return;
    }
  
    if (audioFiles.length === 0) {
      alert('🚫 No valid audio files selected.');
      return;
    }
  
    if (audioFiles.length !== files.length) {
      alert('⚠️ Some non-audio files were ignored.');
    }
  
    uploadFiles(audioFiles);
  
    // ✅ Clear input so user can select same file again if needed
    e.target.value = null;
    
  };
  
  

  // =======================
  // Drag & Drop Handler
  // =======================
  const handleDrop = useCallback((e) => {
    e.preventDefault();
  
    const items = Array.from(e.dataTransfer.items);
    const filePromises = [];
  
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        filePromises.push(readEntry(entry));
      }
    }

    function readEntry(entry) {
      return new Promise((resolve) => {
        if (entry.isFile) {
          entry.file(resolve);
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const entries = [];
    
          const readEntries = () => {
            dirReader.readEntries(async (batch) => {
              if (batch.length === 0) {
                const all = await Promise.all(entries.map(readEntry));
                resolve(all.flat());
              } else {
                entries.push(...batch);
                readEntries();
              }
            });
          };
    
          readEntries();
        }
      });
    }
    
  
    Promise.all(filePromises).then((allFiles) => {
      const flatFiles = allFiles.flat().filter(f => f.type.startsWith('audio/'));
      if (flatFiles.length === 0) {
        alert('🚫 No valid audio files found in selection.');
        return;
      }
      setFilesToUpload(flatFiles);
      uploadFiles(flatFiles); // <<< ADD THIS
    });
  }, []);
  

  // =======================
  // Drag Events Binding
  // =======================
  useEffect(() => {
    const dropArea = document.getElementById('drop-zone');
    const handleDragOver = (e) => e.preventDefault();

    if (dropArea) {
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('drop', handleDrop);
    }
    return () => {
      if (dropArea) {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('drop', handleDrop);
      }
    };
  }, [handleDrop]);

  // =======================
  // Uploading Files
  // =======================  

  const uploadFiles = async (files) => {
    if (!session?.user?.id) {
      console.error('⚠️ Session not ready. Cannot upload files.');
      setMessage('⚠️ Upload skipped. Please refresh and try again.');
      return;
    }
  
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    setUploadComplete(false);
  
    let current = 0;
    const uploadMessages = [];
  
    for (const file of files) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
      // 🎯 Clean the file name for storage (but keep it readable)
      const cleanedName = file.name
      .normalize('NFKD')
      .replace(/\s+/g, '_')
      .replace(/[^\w.\-]/g, '');
  
      const storagePath = `${session.user.id}/${timestamp}_${cleanedName}`;
  
      // 📤 Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false, // don't overwrite
        });
  
      if (uploadError) {
        console.error(`❌ Failed to upload ${metadata[file.name]?.original_name || file.name}:`, uploadError);
        uploadMessages.push(`❌ Failed: ${metadata[file.name]?.original_name || file.name}`);
        continue;
      }
  
      // 🧠 Store metadata (like original name) in Supabase DB
      const { error: metaError } = await supabase
      .from('files_metadata')
      .insert([{
        user_id: session.user.id,
        storage_path: storagePath,
        original_name: file.name,
        created_at: new Date().toISOString(),
        size: (file.size / 1024 / 1024).toFixed(2), // 👈 new field
      }]);
      if (metaError) {
        console.warn(`⚠️ Uploaded ${metadata[file.name]?.original_name || file.name} but failed to save metadata:`, metaError);
        uploadMessages.push(`⚠️ Uploaded (no metadata): ${metadata[file.name]?.original_name || file.name}`);
      } else {
        uploadMessages.push(`✅ Uploaded: ${metadata[file.name]?.original_name || file.name}`);
      }
  
      current += 1;

      const elapsed = (Date.now() - startTime) / 1000; // in seconds
      const avgTimePerFile = elapsed / current;
      const remainingFiles = files.length - current;
      const estimatedRemaining = Math.ceil(avgTimePerFile * remainingFiles);
      
      setUploadProgress({
        current,
        total: files.length,
        estimatedRemaining, // 👈 Add this
      });
      
    }
  
    setMessage(uploadMessages.join('\n'));
    setUploading(false);
    setUploadComplete(true);
    setFilesToUpload([]);
    fetchFiles();
  };
  
  
  const currentScrollRef = useRef(null);

  useEffect(() => {
    if (currentScrollRef.current) {
      currentScrollRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTrack]);

  // =======================
  // Fetch Uploaded Files + Metadata
  // =======================
  const fetchFiles = async () => {
    // 1. Pull full metadata for the current user
    const { data: metadataRows, error: metadataError } = await supabase
      .from('files_metadata')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
  
    if (metadataError) {
      console.error('Error fetching metadata:', metadataError);
      return;
    }
  
    // 2. Build file listing from metadata (instead of storage.list)
    const fixedFiles = metadataRows.map(row => ({
      name: row.original_name,
      path: row.storage_path,
      raw: { name: row.original_name }, // for compatibility
    }));
  
    setFiles(fixedFiles);
  
    // 3. Construct metadata mapping and fetch durations
    const newMetadata = {};
  
    await Promise.all(
      fixedFiles.map(async (file) => {
        const meta = metadataRows.find(m => m.storage_path === file.path);
        const publicUrl = getPublicUrl(file.path);
  
        return new Promise((resolve) => {
          const audio = new Audio(publicUrl);
          let resolved = false;
  
          audio.onloadedmetadata = () => {
            newMetadata[file.name] = {
              duration: audio.duration,
              size: meta?.size || '0.00',
              date: meta?.created_at
                ? new Date(meta.created_at).toLocaleDateString()
                : 'Unknown',
              tags: meta?.tags || ['Uncategorized'],
              bpm: meta?.bpm || null,
              key: meta?.key || null,
              mood: meta?.mood || null,
              original_name: meta?.original_name || file.name,
            };
            resolved = true;
            resolve();
          };
  
          setTimeout(() => {
            if (!resolved) {
              console.warn(`⚠️ Metadata load timed out for ${file.name}`);
              newMetadata[file.name] = {
                duration: null,
                size: meta?.size || '0.00',
                date: meta?.created_at
                  ? new Date(meta.created_at).toLocaleDateString()
                  : 'Unknown',
                tags: meta?.tags || ['Uncategorized'],
                bpm: meta?.bpm || null,
                key: meta?.key || null,
                mood: meta?.mood || null,
                original_name: meta?.original_name || file.name,
              };
              resolve();
            }
          }, 2000);
        });
      })
    );
  
    setMetadata(newMetadata);
  };
  
  
  

  useEffect(() => {
    fetchFiles();
  }, []);

  const getPublicUrl = (fullPath) => {
    const { data } = supabase.storage.from('vault').getPublicUrl(fullPath);
    return data?.publicUrl;
  };


// =======================
// Mass Delete Function
// =======================
const handleMassDelete = async () => {
  const confirm = window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)? This cannot be undone.`);
  if (!confirm) return;

  const pathsToDelete = selectedFiles.map(name => `${session.user.id}/${name}`);

  const { error: storageError } = await supabase
    .storage.from('vault')
    .remove(pathsToDelete);

  const { error: dbError } = await supabase
    .from('files_metadata')
    .delete()
    .in('storage_path', pathsToDelete);

  if (storageError || dbError) {
    console.error('❌ Error deleting files:', storageError || dbError);
    alert('Some files could not be deleted.');
    return;
  }

  setFiles(prev => prev.filter(file => !selectedFiles.includes(file.name)));
  setMetadata(prev => {
    const updated = { ...prev };
    selectedFiles.forEach(name => delete updated[name]);
    return updated;
  });
  setSelectedFiles([]);
  setTimeout(fetchFiles, 1000);
};

// =======================
// Checkbox Toggle Handler
// =======================
const toggleFileSelection = (filename) => {
  setSelectedFiles(prev =>
    prev.includes(filename)
      ? prev.filter(f => f !== filename)
      : [...prev, filename]
  );
};


  // =======================
  // Tag Editor Handlers
  // =======================
  const startEditingTags = (index) => {
    const filename = files[index].name;
    const existingTags = metadata[filename]?.tags?.join(', ') || '';
    setEditingTags(existingTags);
    setEditingIndex(index);
  };

  const saveTags = async (index) => {
    const filename = files[index].name;
    const tagsArray = editingTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    const filePath = `${session.user.id}/${filename}`;
    const { error } = await supabase.from('files_metadata').update({ tags: tagsArray }).eq('storage_path', filePath);
    if (error) {
      console.error('Error updating tags:', error);
    } else {
      setMetadata(prev => ({
        ...prev,
        [filename]: { ...prev[filename], tags: tagsArray }
      }));
    }
    setEditingIndex(null);
    setEditingTags('');
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      saveTags(index);
    }
  };

  // =======================
  // Audio Handlers
  // =======================
  const togglePlay = (index) => {
    const file = files[index];
    const url = getPublicUrl(file.path);
    const meta = metadata[file.name];
  
    setCurrentTrack({
      url,
      name: meta.original_name || file.name,
      tags: meta.tags || [],
      duration: meta.duration,
      size: meta.size,
      date: meta.date,
      autoplay: true,
      storagePath: file.path, // ✅ Needed for tag update
    });
  
    setShowStickyPlayer(true);
  };
  const handleSeek = (index, value) => {
    if (currentAudioRef.current && playingIndex === index) {
      currentAudioRef.current.currentTime = (currentAudioRef.current.duration * value) / 100;
    }
  };

  // =======================
  // Delete File Handler
  // =======================
  const handleDelete = async (index) => {
  const file = files[index];
  const fullStoragePath = file.path;

  await supabase.storage.from('vault').remove([fullStoragePath]);
  await supabase.from('files_metadata').delete().eq('storage_path', fullStoragePath);

  // ✅ Optimistically update local UI
  setFiles((prev) => prev.filter((_, i) => i !== index));
  setMetadata((prev) => {
    const updated = { ...prev };
    delete updated[metadata[file.name]?.original_name || file.name];
    return updated;
  });

  // ✅ Optional slight delay to re-fetch fresh list
  setTimeout(fetchFiles, 3000);
}; // <<-- You must close the function here

// =======================
// Render Visible Files List (Filtered)
// =======================
const visibleFiles = files.filter(file => {
  const rawMeta = metadata[file.name];
  const metaKey = rawMeta?.original_name || file.name;
  const meta = metadata[metaKey] || rawMeta || {};

  if (!meta) return false;

  const tagMatch = !activeTagFilter || meta.tags?.includes(activeTagFilter);

  const searchLower = searchQuery.toLowerCase();
  const fieldsToSearch = [
    metadata[file.name]?.original_name || file.name,
    ...(meta.tags || []),
    meta.mood || '',
    meta.key || '',
    meta.bpm?.toString() || ''
  ];

  const searchMatch = fieldsToSearch.some(field =>
    field.toString().toLowerCase().includes(searchLower)
  );

  return tagMatch && searchMatch;
});

// =======================
// Time Formatting Helper
// =======================
const formatTime = (seconds) => {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  return `${Math.ceil(seconds)}s`;
};



  // =======================
  // Render
  // =======================
  return (
    <div className={styles.container}>

      {/* Upload Box */}
      <div
        id="drop-zone"
        className={styles.dropZone}
        onClick={() => document.getElementById('fileInput').click()} // ✅ INLINE HERE
      >
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#fff' }}>
          Upload Audio to Your Vault
        </h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Drag & Drop Files</p>
        <p style={{ fontSize: '1rem', opacity: 0.6 }}>or</p>
        <p style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>Click to Upload</p>
        <input
          id="fileInput"
          key={Date.now()} // ✅ This forces re-render for same file re-selection
          type="file"
          multiple
          accept=".wav,.mp3"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {uploading && (
  <div style={{ marginTop: '1rem', textAlign: 'center', width: '100%', height: '80px' }}>
    <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
      Uploading {uploadProgress.current} of {uploadProgress.total} files...
    </p>

    <div style={{
      height: '12px',
      backgroundColor: '#333',
      borderRadius: '8px',
      overflow: 'hidden',
      margin: '0 auto',
      width: '60%',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)'
    }}>
      <div style={{
        height: '100%',
        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
        backgroundColor: '#a020f0',
        transition: 'width 0.3s ease',
      }} />
    </div>

    {uploadProgress.estimatedRemaining !== undefined && (
      <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
        ~{formatTime(uploadProgress.estimatedRemaining)} remaining
      </p>
    )}
  </div>
)}


{uploadComplete && (
  <p style={{ color: '#00ff88', marginTop: '1rem', textAlign: 'center' }}>
    Upload complete ✅
  </p>
)}      

      {/* Tag Filter Bar */}
        <div style={{ 
          marginBottom: '1.5rem', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.5rem', 
          justifyContent: 'center' 
        }}>
          {Array.from(new Set(Object.values(metadata).flatMap(m => m.tags || []))).map((tag) => {
            const baseColor = getTagColor(tag);
            const activeColor = adjustBrightness(baseColor, 20); // brighten by 20%

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

        {selectedFiles.length > 0 && (
  <button
    onClick={handleMassDelete}
    style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#a00',
      color: '#fff',
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      zIndex: 9999,
      cursor: 'pointer',
    }}
  >
    🗑 Delete {selectedFiles.length} Selected File{selectedFiles.length > 1 ? 's' : ''}
  </button>
)}



      {/* Uploaded Files */}
      <h2>Vault View</h2>

      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBar}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="checkbox"
          disabled={visibleFiles.length === 0}
          checked={visibleFiles.length > 0 && visibleFiles.every(file => selectedFiles.includes(file.name))}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedFiles(visibleFiles.map(file => file.name));
            } else {
              setSelectedFiles([]);
            }
          }}
        />
        <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Select all visible tracks</label>
      </div>


      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="checkbox"
          disabled={files.length === 0}
          checked={selectedFiles.length === files.length && files.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedFiles(files.map(file => file.name));
            } else {
              setSelectedFiles([]);
            }
          }}
        />
        <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Select all tracks</label>
      </div>

      {/* Header Row for Uploaded Files */}
      <div className={styles.headerRow}>
        <div className={styles.playColumn}></div>
        <div className={styles.titleColumn}>Title</div>
        <div className={styles.genreColumn}>Genre</div>
        <div className={styles.moodColumn}>Mood</div>
        <div className={styles.typeColumn}>Type</div>
        <div className={styles.lengthColumn}>Length</div>
        <div className={styles.sizeColumn}>Size</div>
        <div className={styles.uploadedColumn}>Uploaded</div>
      </div>


      <ul className={styles.uploadedList}>
        {files
          .filter(file => {
            const rawMeta = metadata[file.name];
            const metaKey = rawMeta?.original_name || file.name;
            const meta = metadata[metaKey] || rawMeta || {};
          
            if (!meta) return false;
          
            const tagMatch = !activeTagFilter || meta.tags?.includes(activeTagFilter);
          
            const searchLower = searchQuery.toLowerCase();
            const fieldsToSearch = [
              metadata[file.name]?.original_name || file.name,
              ...(meta.tags || []),
              meta.mood || '',
              meta.key || '',
              meta.bpm?.toString() || ''
            ];
          
            const searchMatch = fieldsToSearch.some(field =>
              field.toString().toLowerCase().includes(searchLower)
            );
          
            return tagMatch && searchMatch;
          })
          
          
          .map((file, index) => {
            const meta = metadata[file.name] || {};

            const url = getPublicUrl(file.path);

            return (
              <li key={file.path}
              ref={el => {
                if (currentTrack?.name === (metadata[file.name]?.original_name || file.name)) {
                  currentScrollRef.current = el;
                }
              }}
                className={`
                  ${styles.uploadedItem} 
                  ${poofingIndex === index ? styles.poof : ''} 
                  ${currentTrack?.name === (metadata[file.name]?.original_name || file.name) ? styles.nowPlaying : ''}
               `}
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>

                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.name)}
                  onChange={() => toggleFileSelection(file.name)}
                />
                  
                  {/* Play / Pause Button */}
                  <button 
                    className={`iconButton ${playingIndex === index ? styles.playingButton : ''}`} 
                    onClick={() => togglePlay(index) }
                    style={{ backgroundColor: playingIndex === index ? '#a020f0' : '#2c2c3a' }}
                  >
                    {playingIndex === index ? <FaPause size={12} color="#fff" /> : <FaPlay size={12} color="#fff" />}
                  </button>

                  {/* Filename */}
                  <span style={{ flex: '0 1 18%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {metadata[file.name]?.original_name || file.name.replace(/ - [a-z0-9]{4}$/, '')}
                  </span>

                  {/* Display Tags */}
                    {(meta.tags || []).map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: getTagColor(tag),
                          color: '#fff',
                          fontSize: '0.7rem',
                          borderRadius: '12px',
                          marginRight: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}



                  {/* Edit Tags */}
                  <button 
                    className="iconButton" 
                    onClick={() => {
                      if (editingIndex === index) {
                        // 🔥 If already editing this one, close it
                        setEditingIndex(null);
                        setEditingTags('');
                      } else {
                        // 🔥 Otherwise open for editing
                        startEditingTags(index);
                      }
                    }}
                    style={{ backgroundColor: editingIndex === index ? '#a020f0' : '#2c2c3a' }}
                  >
                    <FaHashtag size={12} color="#fff" />
                  </button>

                  <div className={styles.metaRightGroup}>
                    <span className={styles.metaDuration}>
                      {meta.duration ? meta.duration.toFixed(1) + 's' : '...'}
                    </span>
                    <span className={styles.metaSize}>
                      {meta.size ? meta.size + ' MB' : '...'}
                    </span>
                    <span className={styles.metaDate}>
                      {meta.date || '...'}
                    </span>
                  </div>



                </div>

                  {/* Edit Tags Inline */}
                  {editingIndex === index && (
                    <div style={{ marginTop: '0.5rem', paddingBottom: '0.5rem', textAlign: 'center' }}>
                      <input
                        value={editingTags}
                        onChange={(e) => setEditingTags(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onBlur={() => saveTags(index)}
                        placeholder="Enter tags separated by commas"
                        style={{
                          width: '60%',
                          padding: '0.5rem',
                          fontSize: '0.9rem',
                          borderRadius: '8px',
                          border: '1px solid #555',
                          backgroundColor: '#222',
                          color: '#fff',
                          textAlign: 'center',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Delete Button */} 
                <button
                  className={styles.trashButton}
                  onClick={() => {
                    setConfirmDeleteIndex(index); // <-- ONLY open confirm dialog
                  }}
                >
                  <FaTrashAlt className={styles.trashButtonIcon} size={16} />
                </button>

                {confirmDeleteIndex === index && (
                  <div className={styles.confirmPopup}>
                    <p>Are you sure you want to delete?</p>
                    <div className={styles.confirmActions}>
                      <button
                        onClick={() => {
                          setPoofingIndex(index); // start poof animation
                          setConfirmDeleteIndex(null); // hide confirm popup
                          setTimeout(() => {
                            handleDelete(index);
                            setPoofingIndex(null);
                          }, 400); // poof timing
                        }}
                        className={styles.confirmButtonDelete}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteIndex(null)}
                        className={styles.confirmButtonCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
      </ul>
            {/* Sticky Player Mount */}
            {showStickyPlayer && currentTrack && (
              <StickyPlayer
              file={currentTrack}
              onTagUpdate={(updatedTags) => {
                setCurrentTrack(prev => ({ ...prev, tags: updatedTags }));
                fetchFiles(); // optional, ensures tag display syncs
              }}
              onClose={() => setShowStickyPlayer(false)}
              onNextTrack={() => {
                const currentIndex = files.findIndex(f => {
                  const name = metadata[f.name]?.original_name || f.name;
                  return name === currentTrack.name;
                });
                if (currentIndex < files.length - 1) {
                  const nextFile = files[currentIndex + 1];
                  const meta = metadata[nextFile.name];
                  const url = getPublicUrl(nextFile.path);
                  setCurrentTrack({
                    url,
                    name: meta.original_name || nextFile.name,
                    tags: meta.tags || [],
                    duration: meta.duration,
                    size: meta.size,
                    date: meta.date,
                    autoplay: true,
                    storagePath: nextFile.path,
                  });
                }
              }}
              
              onPrevTrack={() => {
                const currentIndex = files.findIndex(f => {
                  const name = metadata[f.name]?.original_name || f.name;
                  return name === currentTrack.name;
                });
                if (currentIndex > 0) {
                  const prevFile = files[currentIndex - 1];
                  const meta = metadata[prevFile.name];
                  const url = getPublicUrl(prevFile.path);
                  setCurrentTrack({
                    url,
                    name: meta.original_name || prevFile.name,
                    tags: meta.tags || [],
                    duration: meta.duration,
                    size: meta.size,
                    date: meta.date,
                    autoplay: true, // ✅ Add this too
                  });
                }
              }}
              
            />
            
            )}
    </div>
  );
}

export default Uploader;
