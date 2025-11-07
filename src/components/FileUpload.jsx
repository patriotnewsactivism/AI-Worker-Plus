import React, { useState, useRef } from 'react';
import { Upload, File, X, Download, FolderOpen, Github, GitPullRequest } from 'lucide-react';
import * as zip from '@zip.js/zip.js';

const FileUpload = ({ onFileProcessed, githubConnected, onGitHubConnect, onGitHubPull }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file selection
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // Process uploaded files
  const handleFiles = async (files) => {
    setProcessing(true);
    setProcessingStatus('Processing files...');
    
    const fileArray = Array.from(files);
    const processedFiles = [];
    
    for (const file of fileArray) {
      try {
        let content = '';
        
        // Handle ZIP files
        if (file.name.endsWith('.zip')) {
          setProcessingStatus(`Extracting ${file.name}...`);
          content = await extractZipFile(file);
        } 
        // Handle text files
        else if (file.type.startsWith('text/') || 
                 file.name.endsWith('.js') || 
                 file.name.endsWith('.jsx') || 
                 file.name.endsWith('.json') || 
                 file.name.endsWith('.md') || 
                 file.name.endsWith('.css') || 
                 file.name.endsWith('.html')) {
          setProcessingStatus(`Reading ${file.name}...`);
          content = await file.text();
        }
        // Handle other files
        else {
          content = `[Binary file: ${file.name} (${file.size} bytes)]`;
        }
        
        processedFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: content,
          lastModified: file.lastModified
        });
        
        // Add to uploaded files state
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          content: content
        }]);
        
        // Notify parent component
        onFileProcessed({
          name: file.name,
          type: file.type,
          size: file.size,
          content: content
        });
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setProcessingStatus(`Error processing ${file.name}`);
      }
    }
    
    setProcessing(false);
    setProcessingStatus('');
  };

  // Extract ZIP file contents
  const extractZipFile = async (file) => {
    try {
      // Create a zip reader
      const reader = new zip.ZipReader(new zip.BlobReader(file));
      
      // Get entries
      const entries = await reader.getEntries();
      
      let zipContent = `# ZIP File Contents: ${file.name}\n\n`;
      
      // Process each entry
      for (const entry of entries) {
        if (!entry.directory) {
          try {
            // For text files, read content
            if (entry.filename.endsWith('.txt') || 
                entry.filename.endsWith('.js') || 
                entry.filename.endsWith('.jsx') || 
                entry.filename.endsWith('.json') || 
                entry.filename.endsWith('.md') || 
                entry.filename.endsWith('.css') || 
                entry.filename.endsWith('.html')) {
              
              const textWriter = new zip.TextWriter();
              const content = await entry.getData(textWriter);
              zipContent += `## File: ${entry.filename}\n\n${content}\n\n---\n\n`;
            } 
            // For binary files, just note their presence
            else {
              zipContent += `## File: ${entry.filename} [Binary File]\n\n`;
            }
          } catch (error) {
            console.error('Error reading file:', error);
            zipContent += `## File: ${entry.filename} [Error Reading File]\n\n`;
          }
        }
      }
      
      // Close the reader
      await reader.close();
      
      return zipContent;
    } catch (error) {
      console.error('Error extracting ZIP file:', error);
      return `Error extracting ZIP file: ${error.message}`;
    }
  };

  // Remove file from list
  const removeFile = (fileName) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePullRepo = (e) => {
    e.preventDefault();
    if (repoUrl.trim() === '') {
      alert('Please enter a GitHub repository URL');
      return;
    }
    onGitHubPull(repoUrl);
    setRepoUrl('');
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-header">
        <h3>📁 File Workspace</h3>
        <div className="file-upload-actions">
          <button 
            className="github-connect-btn"
            onClick={onGitHubConnect}
            disabled={githubConnected}
          >
            <Github size={16} />
            {githubConnected ? 'GitHub Connected' : 'Connect GitHub'}
          </button>
        </div>
      </div>
      
      {githubConnected && (
        <div className="github-pull-section">
          <h4>📥 Pull Repository</h4>
          <form onSubmit={handlePullRepo} className="github-pull-form">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="github-repo-input"
            />
            <button type="submit" className="github-pull-btn">
              <GitPullRequest size={16} />
              Pull Repo
            </button>
          </form>
        </div>
      )}
      
      <div 
        className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          onChange={handleChange}
          style={{display: 'none'}}
        />
        
        <div className="file-drop-content">
          <Upload size={48} />
          <p>Drag & drop files here or click to browse</p>
          <button 
            className="browse-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={16} />
            Browse Files
          </button>
        </div>
      </div>
      
      {processing && (
        <div className="processing-status">
          <div className="processing-spinner"></div>
          <p>{processingStatus}</p>
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-list">
          <h4>Uploaded Files</h4>
          <div className="files-grid">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <File size={20} />
                  <div className="file-details">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => removeFile(file.name)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;