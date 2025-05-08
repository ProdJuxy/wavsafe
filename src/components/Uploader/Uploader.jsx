// =======================
// Imports
// =======================
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlay, FaPause, FaWaveSquare, FaHashtag, FaTrashAlt } from 'react-icons/fa';
import RealWaveform from '../RealWaveform/RealWaveform';
import styles from './Uploader.module.css';
import UploadDropZone from './UploadDropZone/UploadDropZone';
import UploadProgressBar from './UploadProgressBar/UploadProgressBar';
import TagFilterBar from './TagFilterBar/TagFilterBar';
import FileList from './FileList/FileList';
import StickyPlayer from '../StickyPlayer/StickyPlayer';
import DevSettingsPanel from './SettingsPanel/DevSettingsPanel';
import FolderSidebar from "../Sidebar/FolderSidebar";
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';
import { useSidebar } from '../../context/SidebarContext';
import useIsMobile from '../../hooks/useIsMobile'; // ← if you use a hook
import MobileFileCard from '../Mobile/MobileFileCard';
import BottomNav from '../Mobile/BottomNav';


// =======================
// Helper: Get Duration of Audio File
// =======================
const getDurationFromFile = (file) => {
  return new Promise((resolve) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };

    audio.onerror = () => {
      console.warn(`Could not load metadata for: ${file.name}`);
      resolve(0);
    };

    audio.src = URL.createObjectURL(file);
  });
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
  const { isCollapsed } = useSidebar();
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
  const [currentTrack, setCurrentTrack] = useState(null);
  const [showStickyPlayer, setShowStickyPlayer] = useState(false);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const startTime = Date.now();
  const devMode = true;
  const isMobile = useIsMobile();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);


  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('all');

  const [options, setOptions] = useState({
    glassy: true,
    limitTo30: true,
    darkModeOverride: false,
    debugConsole: false,
  });
  

  const [showDevSettings, setShowDevSettings] = useState(false);

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
    } else {
      setFolders(data);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const { error } = await supabase
      .from('folders')
      .insert([{ name: newFolderName.trim(), user_id: session.user.id }]);
    if (error) {
      console.error('Error creating folder:', error);
    } else {
      setNewFolderName('');
      fetchFolders();
    }
  };

  const renameFolder = async (folderId, newName) => {
    const { error } = await supabase
      .from('folders')
      .update({ name: newName.trim() })
      .eq('id', folderId);
    if (error) console.error('Error renaming folder:', error);
    else fetchFolders();
  };

  const deleteFolder = async (folderId) => {
    const confirm = window.confirm('Delete this folder and all its contents?');
    if (!confirm) return;
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);
    if (error) console.error('Error deleting folder:', error);
    else fetchFolders();
  };

  const handleAssignSelectedToFolder = async (folderId) => {
    if (!selectedFiles.length) return;
  
    // Map selected names to their full storage paths
    const selectedPaths = files
      .filter(file => selectedFiles.includes(file.name))
      .map(file => file.path);
  
    console.log("Assigning selectedPaths to folder:", folderId, selectedPaths);
  
    const { error } = await supabase
      .from('files_metadata')
      .update({ folder_id: folderId })
      .in('storage_path', selectedPaths);
  
    if (error) {
      console.error('❌ Error assigning folder:', error);
      alert("Something went wrong assigning the folder.");
    } else {
      console.log(`✅ Assigned ${selectedFiles.length} files to folder ${folderId}`);
      setSelectedFiles([]);
      fetchFiles(); // Refresh the metadata and re-render
    }
  };
  
  useEffect(() => {
    if (session?.user?.id) fetchFolders();
  }, [session]);



  // =======================
  // File Upload Change Handler
  // =======================
  const handleFileChange = (e) => {
    const inputFiles = e?.target?.files || e;
    const files = Array.from(inputFiles || []);
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
  
      const cleanedName = file.name
        .normalize('NFKD')
        .replace(/\s+/g, '_')
        .replace(/[^\w.\-]/g, '');
  
      const storagePath = `${session.user.id}/${timestamp}_${cleanedName}`;
  
      // 🎧 Get duration before upload
      const audioDuration = await getDurationFromFile(file);
  
      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
  
      if (uploadError) {
        console.error(`❌ Failed to upload ${file.name}:`, uploadError);
        uploadMessages.push(`❌ Failed: ${file.name}`);
        continue;
      }
  
      const { error: metaError } = await supabase
      .from('files_metadata')
      .insert([{
        user_id: session.user.id,
        storage_path: storagePath,
        original_name: file.name,
        created_at: new Date().toISOString(),
        size: (file.size / 1024 / 1024).toFixed(2),
        duration: audioDuration,
        folder_id: selectedFolderId !== 'all' ? selectedFolderId : null, // ✅ attach folder if set
      }]);
  
      if (metaError) {
        console.warn(`⚠️ Uploaded ${file.name} but failed to save metadata:`, metaError);
        uploadMessages.push(`⚠️ Uploaded (no metadata): ${file.name}`);
      } else {
        uploadMessages.push(`✅ Uploaded: ${file.name}`);
      }
  
      current += 1;
  
      const elapsed = (Date.now() - startTime) / 1000;
      const avgTimePerFile = elapsed / current;
      const remainingFiles = files.length - current;
      const estimatedRemaining = Math.ceil(avgTimePerFile * remainingFiles);
  
      setUploadProgress({
        current,
        total: files.length,
        estimatedRemaining,
      });
    }
  
    setMessage(uploadMessages.join('\n'));
    setUploading(false);
    setUploadComplete(true);
    setFilesToUpload([]);
    fetchFiles();
  };
  
  // =======================

  const currentScrollRef = useRef(null);
  const stickyAudioRef = useRef(null);

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
    const { data: metadataRows, error: metadataError } = await supabase
      .from('files_metadata')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
  
    if (metadataError) {
      console.error('Error fetching metadata:', metadataError);
      return;
    }
  
    const fixedFiles = metadataRows.map(row => ({
      name: row.original_name,
      path: row.storage_path,
      raw: { name: row.original_name },
    }));
  
    setFiles(fixedFiles);
  
    const newMetadata = {};
  
    for (const row of metadataRows) {
      newMetadata[row.original_name] = {
        duration: row.duration || null,
        size: row.size || '0.00',
        date: row.created_at
          ? new Date(row.created_at).toLocaleDateString()
          : 'Unknown',
        tags: row.tags || ['Uncategorized'],
        bpm: row.bpm || null,
        key: row.key || null,
        mood: row.mood || null,
        original_name: row.original_name,
        folder_id: row.folder_id || null,
      };
    }
  
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

  // Get the storage paths from the selected file names
  const pathsToDelete = files
    .filter(file => selectedFiles.includes(file.name))
    .map(file => file.path); // ✅ now uses the actual full storage path

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
const filteredFiles = files.filter(file => {

  const rawMeta = metadata[file.name];
  const metaKey = rawMeta?.original_name || file.name;
  const meta = metadata[metaKey] || rawMeta || {};

  if (!meta) return false;

  const tagMatch = !activeTagFilter || meta.tags?.includes(activeTagFilter);
  const inFolder =
  selectedFolderId === 'all' || !selectedFolderId || meta.folder_id === selectedFolderId;


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

  return inFolder && tagMatch && searchMatch;
});


// Limit to 30 files if the option is enabled

const visibleFiles = options.limitTo30 ? filteredFiles.slice(0, 30) : filteredFiles;


useKeyboardNavigation({
  currentTrack,
  visibleFiles,
  metadata,
  getPublicUrl,
  setCurrentTrack,
  audioRef: stickyAudioRef, // you'll need to forward this from StickyPlayer
  setIsPlaying,
  setProgress,
  onCloseSticky: () => setShowStickyPlayer(false),
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
    <div className={`${styles.container} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}>
      
      {/* 📱 Mobile Sidebar Toggle Button */}
      {isMobile && (
        <button
          className={styles.mobileSidebarToggle}
          onClick={() => setShowMobileSidebar(prev => !prev)}
        >
          ☰
        </button>
      )}
      
      {/* Sidebar (conditionally styled for mobile) */}
      <FolderSidebar
        className={`${styles.sidebar} ${isMobile && showMobileSidebar ? styles.open : ''}`}
        currentView={selectedFolderId}
        onSelect={setSelectedFolderId}
        folders={folders}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        createFolder={createFolder}
        deleteFolder={deleteFolder}
        renameFolder={renameFolder}
        onAssignSelectedToFolder={handleAssignSelectedToFolder}
      />

    <UploadDropZone
        session={session}
        onFilesSelected={handleFileChange}
        glassy={options.glassy}
      />
      <DevSettingsPanel
        visible={showDevSettings}
        onClose={() => setShowDevSettings(false)}
        options={options}
        setOptions={setOptions}
      />

      <UploadProgressBar
        uploading={uploading}
        uploadProgress={uploadProgress}
        uploadComplete={uploadComplete}
      /> 

      <TagFilterBar
        metadata={metadata}
        activeTagFilter={activeTagFilter}
        setActiveTagFilter={setActiveTagFilter}
      />


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

      <button
        onClick={() => setShowDevSettings(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          background: 'transparent',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 40,
          height: 40,
          fontSize: 20,
          cursor: 'pointer',
          zIndex: 9999,
        }}
        title="Developer Settings"
      >
        ⚙️
      </button>


      {isMobile ? (
  <>
    {visibleFiles.map((file, index) => (
      <MobileFileCard
        key={index}
        file={file}
        isPlaying={currentTrack?.name === file.name}
        onPlay={() => {
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
          setShowStickyPlayer(true);
        }}
      />
    ))}
    <BottomNav
      setCurrentView={setSelectedFolderId} // or another view if you want
      handleUpload={() => document.getElementById('file-input')?.click()}
    />
  </>
) : (
  <FileList
    files={files}
    metadata={metadata}
    visibleFiles={visibleFiles}
    currentTrack={currentTrack}
    setCurrentTrack={setCurrentTrack}
    selectedFiles={selectedFiles}
    setSelectedFiles={setSelectedFiles}
    getPublicUrl={getPublicUrl}
    fetchFiles={fetchFiles}
    setShowStickyPlayer={setShowStickyPlayer}
  />
)}


            {/* Sticky Player Mount */}
          
            {showStickyPlayer && currentTrack && (
              <StickyPlayer
                file={currentTrack}
                audioRef={stickyAudioRef}
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
