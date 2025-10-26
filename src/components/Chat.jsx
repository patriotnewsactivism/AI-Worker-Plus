import React, { memo, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Square, Bot, User } from 'lucide-react';
import { marked } from 'marked';

const Chat = memo(({ 
  messages, 
  inputValue, 
  setInputValue, 
  isListening, 
  isProcessing, 
  isLongTaskRunning, 
  longTaskProgress, 
  agentResults, 
  aiName, 
  selectedTemplate, 
  handleSubmit, 
  toggleListening, 
  stopLongTask 
}) => {
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Memoized Message component for performance
  const MessageComponent = memo(({ message }) => {
    if (message.type === 'ai') {
      return (
        <div className="message ai-message">
          <div className="message-avatar">
            <Bot size={20} />
          </div>
          <div className="message-content">
            <div dangerouslySetInnerHTML={{ __html: marked(message.content) }} />
            <div className="message-timestamp">{message.timestamp}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="message user-message">
          <div className="message-content">
            <div>{message.content}</div>
            <div className="message-timestamp">{message.timestamp}</div>
          </div>
          <div className="message-avatar">
            <User size={20} />
          </div>
        </div>
      );
    }
  });

  MessageComponent.displayName = 'MessageComponent';

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(message => (
          <MessageComponent key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Long Task Progress */}
      {isLongTaskRunning && (
        <div className="long-task-progress">
          <div className="progress-header">
            <span>Processing Long Task...</span>
            <button onClick={stopLongTask} className="stop-btn">
              <Square size={16} /> Stop
            </button>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${longTaskProgress}%` }}
            ></div>
          </div>
          <div className="progress-text">{longTaskProgress}% Complete</div>
        </div>
      )}

      {/* Agent Results */}
      {agentResults.length > 0 && (
        <div className="agent-results">
          <h3>🤖 Multi-Agent Results</h3>
          <div className="results-grid">
            {agentResults.map((result, index) => (
              <div key={index} className="result-card">
                <div className="result-header">
                  <span className="agent-name">{result.agent}</span>
                  <span className="agent-type">{result.type}</span>
                </div>
                <div className="result-content">
                  {result.result.substring(0, 150)}...
                </div>
                <div className="result-timestamp">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form className="input-area" onSubmit={handleSubmit}>
        <div className="input-container">
          <button
            type="button"
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            disabled={isProcessing || isLongTaskRunning}
            title={isListening ? "Stop listening" : "Start voice command"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${aiName}... (or say "${aiName}")`}
            disabled={isProcessing || isLongTaskRunning}
            className={isListening ? 'listening' : ''}
          />
          
          <button
            type="submit"
            className="send-btn"
            disabled={!inputValue.trim() || isProcessing || isLongTaskRunning}
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
        
        <div className="input-footer">
          <div className="template-indicator">
            <span className="template-name">{selectedTemplate}</span>
            <span className="ai-name">as {aiName}</span>
          </div>
          
          <div className="input-status">
            {isProcessing && (
              <span className="processing">Processing...</span>
            )}
            {isListening && (
              <span className="listening-status">🎤 Listening for "{aiName}"</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
});

Chat.displayName = 'Chat';

export default Chat;