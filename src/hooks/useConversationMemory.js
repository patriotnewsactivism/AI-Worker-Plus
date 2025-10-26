import { useState, useEffect, useCallback } from 'react';

// Conversation memory hook for persistent conversation history
export const useConversationMemory = (apiKey) => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [contextSummary, setContextSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load conversation history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('conversationHistory');
    const savedSummary = localStorage.getItem('contextSummary');
    
    if (savedHistory) {
      try {
        setConversationHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    }
    
    if (savedSummary) {
      setContextSummary(savedSummary);
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  // Save context summary to localStorage
  useEffect(() => {
    if (contextSummary) {
      localStorage.setItem('contextSummary', contextSummary);
    }
  }, [contextSummary]);

  // Add message to conversation history
  const addMessage = useCallback((message) => {
    setConversationHistory(prev => [...prev, {
      ...message,
      id: message.id || Date.now(),
      timestamp: message.timestamp || new Date().toISOString()
    }]);
  }, []);

  // Update context summary using AI
  const updateContextSummary = useCallback(async (newMessages) => {
    if (!apiKey || newMessages.length === 0) return;

    setIsLoading(true);
    try {
      const recentMessages = newMessages.slice(-10); // Last 10 messages
      const prompt = `Please create a concise summary of the conversation context based on these recent messages. Focus on key topics, decisions, and important information that should be remembered for future interactions.

Recent messages:
${recentMessages.map(msg => `${msg.type}: ${msg.content}`).join('\n')}

Current context summary: ${contextSummary}

Please provide an updated context summary that incorporates the new information while maintaining the most important previous context. Keep it under 200 words.`;

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
            temperature: 0.3,
            maxOutputTokens: 300,
            topK: 1,
            topP: 0.95
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (summary) {
          setContextSummary(summary);
        }
      }
    } catch (error) {
      console.error('Error updating context summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, contextSummary]);

  // Get conversation context for AI prompts
  const getConversationContext = useCallback(() => {
    const recentMessages = conversationHistory.slice(-20); // Last 20 messages
    return {
      history: recentMessages,
      summary: contextSummary,
      totalMessages: conversationHistory.length
    };
  }, [conversationHistory, contextSummary]);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setContextSummary('');
    localStorage.removeItem('conversationHistory');
    localStorage.removeItem('contextSummary');
  }, []);

  // Export conversation data
  const exportConversation = useCallback(() => {
    const data = {
      history: conversationHistory,
      summary: contextSummary,
      exportDate: new Date().toISOString(),
      totalMessages: conversationHistory.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [conversationHistory, contextSummary]);

  return {
    conversationHistory,
    contextSummary,
    isLoading,
    addMessage,
    updateContextSummary,
    getConversationContext,
    clearHistory,
    exportConversation
  };
};