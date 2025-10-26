import { useState, useCallback } from 'react';
import { useConversationMemory } from './useConversationMemory';
import { useStreamingResponse } from './useStreamingResponse';
import { useMultiModal } from './useMultiModal';
import { useFunctionCalling } from './useFunctionCalling';

// Context-aware AI hook that combines all advanced AI features
export const useContextAwareAI = (apiKey) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  
  // Initialize all hooks
  const conversationMemory = useConversationMemory(apiKey);
  const streamingResponse = useStreamingResponse();
  const multiModal = useMultiModal();
  const functionCalling = useFunctionCalling();

  // Generate context-aware AI response
  const generateResponse = useCallback(async (userInput, template, personality, responseStyle, temperature, maxTokens, customPrompt, skills) => {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    setIsProcessing(true);
    setCurrentResponse('');

    try {
      // Get conversation context
      const context = conversationMemory.getConversationContext();
      
      // Build context-aware prompt
      let prompt = buildContextAwarePrompt(
        userInput,
        template,
        personality,
        responseStyle,
        customPrompt,
        skills,
        context,
        multiModal.uploadedFiles
      );

      // Add function calling context if available
      const functionDefinitions = functionCalling.getFunctionDefinitions();
      if (functionDefinitions.length > 0) {
        prompt += `\n\nAvailable functions you can call:
${functionDefinitions.map(func => `- ${func.name}: ${func.description}`).join('\n')}

You can call these functions by including [FUNCTION:functionName:args] in your response.`;

        // Check if user input suggests function calling
        const functionCallMatch = userInput.match(/\[FUNCTION:(\w+):(.*?)\]/);
        if (functionCallMatch) {
          const [, functionName, argsString] = functionCallMatch;
          try {
            const args = JSON.parse(argsString);
            const result = await functionCalling.executeFunction(functionName, args);
            prompt += `\n\nFunction call result: ${JSON.stringify(result)}`;
          } catch (error) {
            prompt += `\n\nFunction call error: ${error.message}`;
          }
        }
      }

      // Generate streaming response
      await streamingResponse.streamResponse(
        prompt,
        apiKey,
        (chunk) => {
          setCurrentResponse(chunk);
        },
        (completeResponse) => {
          setCurrentResponse(completeResponse);
          
          // Add to conversation memory
          conversationMemory.addMessage({
            type: 'user',
            content: userInput,
            timestamp: new Date().toISOString()
          });
          
          conversationMemory.addMessage({
            type: 'ai',
            content: completeResponse,
            timestamp: new Date().toISOString()
          });

          // Update context summary
          conversationMemory.updateContextSummary([
            { type: 'user', content: userInput },
            { type: 'ai', content: completeResponse }
          ]);
        }
      );

      return currentResponse;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [apiKey, conversationMemory, streamingResponse, multiModal, functionCalling, currentResponse]);

  // Build context-aware prompt
  const buildContextAwarePrompt = useCallback((
    userInput,
    template,
    personality,
    responseStyle,
    customPrompt,
    skills,
    context,
    uploadedFiles
  ) => {
    let prompt = `You are an AI assistant with ${personality} personality and ${responseStyle} response style.

Current conversation context:
${context.summary ? `Summary: ${context.summary}\n` : ''}
Recent messages: ${context.history.length} total messages
${context.history.slice(-5).map(msg => `${msg.type}: ${msg.content.substring(0, 100)}...`).join('\n')}

Template: ${template}
${customPrompt ? `Custom instructions: ${customPrompt}\n` : ''}
${skills && skills.length > 0 ? `Skills: ${skills.join(', ')}\n` : ''}

User request: ${userInput}`;

    // Add multi-modal context
    if (uploadedFiles && uploadedFiles.length > 0) {
      prompt += `\n\nAttached files:
${uploadedFiles.map(file => `- ${file.description}`).join('\n')}`;
    }

    return prompt;
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    conversationMemory.clearHistory();
    multiModal.clearFiles();
    functionCalling.clearResults();
    setCurrentResponse('');
  }, [conversationMemory, multiModal, functionCalling]);

  // Export all data
  const exportAllData = useCallback(() => {
    const data = {
      conversation: conversationMemory.conversationHistory,
      contextSummary: conversationMemory.contextSummary,
      files: multiModal.uploadedFiles.map(file => ({
        name: file.name,
        type: file.type,
        description: file.description
      })),
      functionResults: functionCalling.functionResults,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-worker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [conversationMemory, multiModal, functionCalling]);

  return {
    // State
    isProcessing,
    currentResponse,
    
    // Conversation memory
    conversationHistory: conversationMemory.conversationHistory,
    contextSummary: conversationMemory.contextSummary,
    updateContextSummary: conversationMemory.updateContextSummary,
    clearHistory: conversationMemory.clearHistory,
    exportConversation: conversationMemory.exportConversation,
    
    // Streaming
    isStreaming: streamingResponse.isStreaming,
    streamedContent: streamingResponse.streamedContent,
    streamingError: streamingResponse.streamingError,
    stopStreaming: streamingResponse.stopStreaming,
    
    // Multi-modal
    uploadedFiles: multiModal.uploadedFiles,
    handleFileUpload: multiModal.handleFileUpload,
    removeFile: multiModal.removeFile,
    clearFiles: multiModal.clearFiles,
    getFilesByType: multiModal.getFilesByType,
    
    // Function calling
    registerFunction: functionCalling.registerFunction,
    unregisterFunction: functionCalling.unregisterFunction,
    executeFunction: functionCalling.executeFunction,
    functionResults: functionCalling.functionResults,
    getFunctionDefinitions: functionCalling.getFunctionDefinitions,
    
    // Main functions
    generateResponse,
    clearAllData,
    exportAllData
  };
};