import { useState, useCallback } from 'react';

// Streaming response hook for real-time AI responses
export const useStreamingResponse = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [streamingError, setStreamingError] = useState(null);

  // Simulate streaming response (in real implementation, this would use Server-Sent Events or WebSocket)
  const streamResponse = useCallback(async (prompt, apiKey, onChunk, onComplete) => {
    setIsStreaming(true);
    setStreamedContent('');
    setStreamingError(null);

    try {
      // For now, we'll simulate streaming by making a regular API call and chunking the response
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            topK: 1,
            topP: 0.95
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const fullContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Simulate streaming by chunking the response
      const words = fullContent.split(' ');
      let currentContent = '';

      for (let i = 0; i < words.length; i++) {
        currentContent += (i > 0 ? ' ' : '') + words[i];
        setStreamedContent(currentContent);
        
        if (onChunk) {
          onChunk(currentContent);
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (onComplete) {
        onComplete(currentContent);
      }

    } catch (error) {
      console.error('Streaming error:', error);
      setStreamingError(error.message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    setStreamedContent('');
    setStreamingError(null);
  }, []);

  return {
    isStreaming,
    streamedContent,
    streamingError,
    streamResponse,
    stopStreaming
  };
};