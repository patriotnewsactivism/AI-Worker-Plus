import { useState, useCallback } from 'react';

// Multi-modal support hook for handling images, audio, and other media
export const useMultiModal = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle file upload and processing
  const handleFileUpload = useCallback(async (files) => {
    setIsProcessing(true);
    const processedFiles = [];

    for (const file of files) {
      try {
        const fileData = await processFile(file);
        processedFiles.push(fileData);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    setUploadedFiles(prev => [...prev, ...processedFiles]);
    setIsProcessing(false);
    return processedFiles;
  }, []);

  // Process different file types
  const processFile = useCallback(async (file) => {
    const fileData = {
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      content: null,
      preview: null
    };

    // Handle images
    if (file.type.startsWith('image/')) {
      fileData.content = await fileToBase64(file);
      fileData.preview = URL.createObjectURL(file);
      fileData.description = `Image: ${file.name} (${formatFileSize(file.size)})`;
    }
    // Handle audio
    else if (file.type.startsWith('audio/')) {
      fileData.content = await fileToBase64(file);
      fileData.preview = URL.createObjectURL(file);
      fileData.description = `Audio: ${file.name} (${formatFileSize(file.size)})`;
    }
    // Handle video
    else if (file.type.startsWith('video/')) {
      fileData.content = await fileToBase64(file);
      fileData.preview = URL.createObjectURL(file);
      fileData.description = `Video: ${file.name} (${formatFileSize(file.size)})`;
    }
    // Handle documents
    else if (file.type === 'application/pdf' || 
             file.name.endsWith('.pdf') ||
             file.name.endsWith('.doc') ||
             file.name.endsWith('.docx')) {
      fileData.content = await fileToBase64(file);
      fileData.description = `Document: ${file.name} (${formatFileSize(file.size)})`;
    }
    // Handle text files
    else if (file.type.startsWith('text/') || 
             file.name.endsWith('.txt') ||
             file.name.endsWith('.md')) {
      fileData.content = await file.text();
      fileData.description = `Text: ${file.name} (${formatFileSize(file.size)})`;
    }
    // Handle other files
    else {
      fileData.content = `[Binary file: ${file.name} (${formatFileSize(file.size)})]`;
      fileData.description = `File: ${file.name} (${formatFileSize(file.size)})`;
    }

    return fileData;
  }, []);

  // Convert file to base64
  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Remove file
  const removeFile = useCallback((fileId) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file && file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    uploadedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadedFiles([]);
  }, [uploadedFiles]);

  // Get files by type
  const getFilesByType = useCallback((type) => {
    return uploadedFiles.filter(file => file.type.startsWith(type));
  }, [uploadedFiles]);

  // Generate AI prompt with multi-modal context
  const generateMultiModalPrompt = useCallback((userPrompt, files) => {
    let prompt = userPrompt;
    
    if (files && files.length > 0) {
      prompt += '\n\nAttached files:\n';
      files.forEach(file => {
        prompt += `- ${file.description}\n`;
        if (file.type.startsWith('text/') && file.content) {
          prompt += `Content: ${file.content.substring(0, 500)}...\n`;
        }
      });
    }

    return prompt;
  }, []);

  return {
    uploadedFiles,
    isProcessing,
    handleFileUpload,
    removeFile,
    clearFiles,
    getFilesByType,
    generateMultiModalPrompt
  };
};