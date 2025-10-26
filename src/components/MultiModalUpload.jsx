import React, { memo, useCallback } from 'react';
import { Upload, Image, FileAudio, Video, FileText, X, Eye } from 'lucide-react';

const MultiModalUpload = memo(({ 
  uploadedFiles, 
  onFileUpload, 
  onRemoveFile, 
  isProcessing 
}) => {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    onFileUpload(files);
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    onFileUpload(files);
  }, [onFileUpload]);

  const getFileIcon = useCallback((fileType) => {
    if (fileType.startsWith('image/')) return <Image size={20} />;
    if (fileType.startsWith('audio/')) return <FileAudio size={20} />;
    if (fileType.startsWith('video/')) return <Video size={20} />;
    return <FileText size={20} />;
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="multi-modal-upload">
      <div 
        className="upload-drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
      >
        <input
          type="file"
          multiple
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="multi-modal-upload"
        />
        <label htmlFor="multi-modal-upload" className="upload-label">
          <Upload size={32} />
          <p>Drop files here or click to browse</p>
          <small>Supports images, audio, video, documents, and text files</small>
        </label>
      </div>

      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner"></div>
          <span>Processing files...</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Attached Files ({uploadedFiles.length})</h4>
          <div className="files-grid">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-preview">
                  {file.preview ? (
                    <img 
                      src={file.preview} 
                      alt={file.name}
                      className="preview-image"
                    />
                  ) : (
                    <div className="file-icon">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </div>
                <div className="file-info">
                  <div className="file-name" title={file.name}>
                    {file.name}
                  </div>
                  <div className="file-details">
                    {formatFileSize(file.size)} • {file.type}
                  </div>
                </div>
                <div className="file-actions">
                  {file.preview && (
                    <button
                      className="preview-btn"
                      onClick={() => window.open(file.preview, '_blank')}
                      title="Preview file"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveFile(file.id)}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

MultiModalUpload.displayName = 'MultiModalUpload';

export default MultiModalUpload;