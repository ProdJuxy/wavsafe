// components/Uploader/FileList/FileList.jsx

import FileItem from '../FileItem/FileItem';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import styles from './FileList.module.css';

function FileList({
  files,
  metadata,
  visibleFiles,
  currentTrack,
  setCurrentTrack,
  selectedFiles,
  setSelectedFiles,
  getPublicUrl,
  fetchFiles,
  setShowStickyPlayer,
}) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingTags, setEditingTags] = useState('');
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [poofingIndex, setPoofingIndex] = useState(null);
  const currentScrollRef = useRef(null);

  useEffect(() => {
    if (currentScrollRef.current) {
      currentScrollRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTrack]);

  const togglePlay = (file, index) => {
    const meta = metadata[file.name];
    const url = getPublicUrl(file.path);

    if (!meta) {
      console.warn(`⚠️ Missing metadata for ${file.name}`);
      return;
    }

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
  };

  const toggleFileSelection = (filename) => {
    setSelectedFiles((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  };

  const startEditingTags = (index) => {
    const filename = visibleFiles[index].name;
    const existingTags = metadata[filename]?.tags?.join(', ') || '';
    setEditingTags(existingTags);
    setEditingIndex(index);
  };

  const saveTags = async (index) => {
    const file = visibleFiles[index];
    const tagsArray = editingTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const filePath = file.path;
    const { error } = await supabase
      .from('files_metadata')
      .update({ tags: tagsArray })
      .eq('storage_path', filePath);

    if (!error) {
      fetchFiles();
    }

    setEditingIndex(null);
    setEditingTags('');
  };

  const handleDelete = async (index) => {
    const file = visibleFiles[index];
    const fullStoragePath = file.path;

    await supabase.storage.from('vault').remove([fullStoragePath]);
    await supabase.from('files_metadata').delete().eq('storage_path', fullStoragePath);

    setConfirmDeleteIndex(null);
    setPoofingIndex(null);
    setEditingIndex(null);

    setTimeout(fetchFiles, 500);
  };

  return (
    <ul className={styles.fileListContainer}>
      {visibleFiles.map((file, index) => {
        const meta = metadata[file.name] || {};
        const isPlaying = currentTrack?.name === (meta.original_name || file.name);
        const isSelected = selectedFiles.includes(file.name);
        const editing = editingIndex === index;
        const showConfirm = confirmDeleteIndex === index;

        return (
          <div
            key={file.path}
            ref={isPlaying ? currentScrollRef : null}
          >
            <FileItem
              file={file}
              meta={meta}
              isPlaying={isPlaying}
              isSelected={isSelected}
              editing={editing}
              editingTags={editingTags}
              showConfirm={showConfirm}
              onTogglePlay={() => togglePlay(file, index)}
              onToggleSelect={toggleFileSelection}
              onStartEdit={() => startEditingTags(index)}
              onSetEditingTags={setEditingTags}
              onSaveTags={() => saveTags(index)}
              onDeleteConfirm={() => setConfirmDeleteIndex(index)}
              onDeleteCancel={() => setConfirmDeleteIndex(null)}
              onDelete={() => handleDelete(index)}
            />
          </div>
        );
      })}
    </ul>
  );
}

export default FileList;
