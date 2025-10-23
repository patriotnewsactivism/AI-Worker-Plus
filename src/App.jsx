import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Play, Square, Settings, Bot, Calendar, FileText, BarChart3, Lightbulb, Code, Clock, User, Brain, Coffee, Zap, Target, Rocket } from 'lucide-react';
import { marked } from 'marked';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

function App() {
  // Configuration state
  const [aiName, setAiName] = useState('Assistant');
  const [selectedTemplate, setSelectedTemplate] = useState('General');
  const [customPrompt, setCustomPrompt] = useState('');
  const [skills, setSkills] = useState(['React', 'JavaScript', 'HTML/CSS']);
  const [newSkill, setNewSkill] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `👋 Hello! I'm your AI employee.\n\n🎯 Just say my name ("${aiName}") followed by your request and I'll respond instantly!\n\n💻 Try the "Developer" template for coding help or "Long Task" for extended processing.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Long task state
  const [longTaskRunning, setLongTaskRunning] = useState(false);
  const [longTaskProgress, setLongTaskProgress] = useState(0);
  const longTaskInterval = useRef(null);
  
  // Memory bank state
  const [memoryBank, setMemoryBank] = useState([
    { id: 1, content: "Project requirements discussed", timestamp: "Today, 10:30 AM" },
    { id: 2, content: "Meeting scheduled for tomorrow", timestamp: "Today, 11:15 AM" }
  ]);
  
  // Cloud sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState('connected');
  
  // Statistics
  const [stats, setStats] = useState({
    messages: 1,
    words: 42,
    time: 0
  });
  
  const sessionStartTime = useRef(Date.now());
  
  // Speech recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    interimTranscript
  } = useSpeechRecognition();
  
  // Auto-scroll chat to bottom
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime.current) / 60000);
      setStats(prev => ({ ...prev, time: elapsed }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Handle speech recognition - IMPROVED VERSION
  useEffect(() => {
    // Process interim transcript for real-time response
    if (listening && interimTranscript) {
      const lowerTranscript = interimTranscript.toLowerCase();
      const lowerAiName = aiName.toLowerCase();
      
      // Check if the AI name is mentioned in the transcript
      if (lowerTranscript.includes(lowerAiName)) {
        // Extract the actual command (remove the AI name)
        const commandStartIndex = lowerTranscript.indexOf(lowerAiName) + lowerAiName.length;
        const command = interimTranscript.substring(commandStartIndex).trim();
        
        if (command) {
          // Add the voice command to the input
          setInputValue(command);
          
          // Process the command immediately
          handleSendMessage(command);
          
          // Reset transcript for next command
          resetTranscript();
          toast.success(`🎤 Command received: "${command}"`);
        }
      }
    }
    
    // Also process final transcript
    if (listening && transcript && transcript !== '') {
      const lowerTranscript = transcript.toLowerCase();
      const lowerAiName = aiName.toLowerCase();
      
      // Check if the AI name is mentioned in the transcript
      if (lowerTranscript.includes(lowerAiName)) {
        // Extract the actual command (remove the AI name)
        const commandStartIndex = lowerTranscript.indexOf(lowerAiName) + lowerAiName.length;
        const command = transcript.substring(commandStartIndex).trim();
        
        if (command) {
          // Add the voice command to the input
          setInputValue(command);
          
          // Process the command
          handleSendMessage(command);
          
          // Reset transcript for next command
          resetTranscript();
          toast.success(`🎤 Command received: "${command}"`);
        }
      }
    }
  }, [interimTranscript, transcript, listening, aiName]);
  
  // Handle long task simulation
  useEffect(() => {
    if (longTaskRunning) {
      longTaskInterval.current = setInterval(() => {
        setLongTaskProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 3) + 1;
          if (newProgress >= 100) {
            setLongTaskRunning(false);
            clearInterval(longTaskInterval.current);
            return 100;
          }
          return newProgress;
        });
      }, 200);
    } else {
      clearInterval(longTaskInterval.current);
    }
    
    return () => clearInterval(longTaskInterval.current);
  }, [longTaskRunning]);
  
  // Save configuration to localStorage
  useEffect(() => {
    const config = {
      aiName,
      selectedTemplate,
      customPrompt,
      skills,
      apiKey
    };
    localStorage.setItem('aiEmployeeConfig', JSON.stringify(config));
  }, [aiName, selectedTemplate, customPrompt, skills, apiKey]);
  
  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiEmployeeConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAiName(config.aiName || 'Assistant');
      setSelectedTemplate(config.selectedTemplate || 'General');
      setCustomPrompt(config.customPrompt || '');
      setSkills(config.skills || ['React', 'JavaScript', 'HTML/CSS']);
      setApiKey(config.apiKey || '');
    }
  }, []);
  
  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim() || isProcessing) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      messages: prev.messages + 1,
      words: prev.words + message.split(' ').length
    }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate AI response based on template
      let aiResponse = '';
      
      switch(selectedTemplate) {
        case 'Meeting':
          aiResponse = `📅 **Meeting Planner Activated**\n\nI've prepared your meeting agenda:\n\n**Meeting Agenda**\n1. Project status review\n2. Timeline adjustments discussion\n3. Team concerns addressment\n\nWould you like me to send calendar invites or prepare materials?`;
          break;
        case 'Summary':
          aiResponse = `📋 **Summary Generator Activated**\n\nHere's a concise summary of your request:\n\n**Key Points**\n• Main topic clearly identified\n• Important details highlighted\n• Action items clearly defined\n\nIs there a specific aspect you'd like me to elaborate on?`;
          break;
        case 'Analysis':
          aiResponse = `📊 **Data Analyst Activated**\n\nI've analyzed the information and here are my findings:\n\n**Analysis Results**\n• Trend identification completed\n• Statistical insights generated\n• Actionable recommendations provided\n\nI can provide a detailed report or visualize this data if needed.`;
          break;
        case 'Creative':
          aiResponse = `💡 **Creative Brain Activated**\n\nHere are some innovative ideas for your project:\n\n**Brainstorming Results**\n1. 🚀 Revolutionary approach\n2. ✨ Unique solutions\n3. 🎨 Creative alternatives\n\nWhich of these resonates with you? I can develop any idea further.`;
          break;
        case 'Developer':
          aiResponse = `💻 **Developer Specialist Activated**\n\nI can help create applications and solve coding challenges.\n\n\`\`\`jsx\n// Example React component\nfunction AIWorker() {\n  return (\n    <div className="ai-worker">\n      <h1>Welcome to AI Worker Plus</h1>\n      <button onClick={handleVoiceCommand}>\n        Click for voice activation\n      </button>\n    </div>\n  );\n}\n\`\`\`\n\nWhat specific coding task would you like me to help with today?`;
          break;
        case 'Long Task':
          aiResponse = `⏱️ **Long Task Processor Activated**\n\nI'm starting an extended processing task:\n\n**Task Details**\n• Processing large datasets\n• Generating detailed reports\n• Continuous background updates\n\nFeel free to continue working while I process this in the background.`;
          break;
        default:
          aiResponse = `👋 Hello! I'm your AI employee ready to assist with:\n\n• Providing detailed information\n• Solving problems efficiently\n• Managing tasks and schedules\n\nHow would you like me to help you today?`;
      }
      
      // Add AI message
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-record important information to memory bank
      if (selectedTemplate !== 'General') {
        const memoryEntry = {
          id: Date.now(),
          content: `${selectedTemplate}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setMemoryBank(prev => [memoryEntry, ...prev.slice(0, 4)]);
        toast.success('💾 Information saved to memory bank');
      }
      
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "❌ Sorry, I encountered an error. Please check your API key and try again.",
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('AI processing error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      toast.success('🔇 Voice recognition stopped');
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, interimResults: true });
      toast.success(`🎤 Listening for "${aiName}"... Speak now!`);
    }
  };
  
  const toggleLongTask = () => {
    if (longTaskRunning) {
      setLongTaskRunning(false);
      setLongTaskProgress(0);
      toast.success('⏹️ Task stopped');
    } else {
      setLongTaskRunning(true);
      setLongTaskProgress(0);
      toast.success('▶️ Long task started');
    }
  };
  
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      toast.success('✅ Skill added');
    }
  };
  
  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
    toast.success('🗑️ Skill removed');
  };
  
  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    return (
      <div 
        className={`message ${isUser ? 'message-user' : 'message-ai'}`}
        key={message.id}
      >
        <div 
          className="message-content"
          dangerouslySetInnerHTML={{ 
            __html: marked(message.content) 
          }}
        />
        <div className="message-timestamp">{message.timestamp}</div>
      </div>
    );
  };
  
  const templates = [
    { name: 'General', icon: Bot, color: 'blue', description: 'Everyday assistance' },
    { name: 'Meeting', icon: Calendar, color: 'green', description: 'Schedule & prepare' },
    { name: 'Summary', icon: FileText, color: 'purple', description: 'Create summaries' },
    { name: 'Analysis', icon: BarChart3, color: 'pink', description: 'Data insights' },
    { name: 'Creative', icon: Lightbulb, color: 'orange', description: 'Ideation help' },
    { name: 'Developer', icon: Code, color: 'blue', description: 'Coding expert' },
    { name: 'Long Task', icon: Clock, color: 'green', description: 'Extended processing' }
  ];
  
  // Check for browser support
  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="app-container">
        <div className="panel-card">
          <h2>Browser Not Supported</h2>
          <p>Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari for voice commands.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="app-container">
      <Toaster position="top-right" />
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal">
            <button 
              className="modal-close"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>
            <h2>⚙️ AI Employee Settings</h2>
            
            <div className="api-key-section">
              <label>🤖 AI Name</label>
              <input
                type="text"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                className="input-field"
                placeholder="Enter AI name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your AI will respond when it hears this name during voice commands
              </p>
            </div>
            
            <div className="api-key-section">
              <label>🔑 Gemini API Key</label>
              <div className="api-key-input-group">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input-field"
                  placeholder="Enter your Gemini API key"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your free API key at{' '}
                <a 
                  href="https://aistudio.google.com/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            
            <div className="api-key-section">
              <label>🛠️ AI Skills</label>
              <div className="skill-input-group">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="input-field"
                  placeholder="Add a new skill"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <button 
                  onClick={addSkill}
                  className="template-btn template-blue"
                >
                  Add
                </button>
              </div>
              <div className="skill-tags">
                {skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    {skill}
                    <button 
                      className="skill-tag-remove"
                      onClick={() => removeSkill(skill)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <div className="logo-circle">
              <Bot size={28} />
            </div>
            <div>
              <h1>AI Worker Plus</h1>
              <p>Advanced AI Employee with Voice Commands & Long Tasks</p>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-badge">
              <Bot size={16} />
              {stats.messages} Messages
            </div>
            <div className="stat-badge">
              <FileText size={16} />
              {stats.words} Words
            </div>
            <div className="stat-badge">
              <Clock size={16} />
              {stats.time} Min Session
            </div>
            <div className="stat-badge">
              <Zap size={16} />
              {skills.length} Skills
            </div>
          </div>
        </div>
      </header>
      
      <div className="main-content">
        {/* Left Panel - Configuration */}
        <div className="left-panel">
          <div className="panel-card config-panel">
            <h2 className="panel-title">
              <Settings size={20} />
              Configuration
            </h2>
            
            <div className="section">
              <label>📋 AI Employee Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="input-field"
              >
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <option key={template.name} value={template.name}>
                      {template.name} - {template.description}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="section">
              <label>📝 Custom Instructions</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="input-field"
                rows="4"
                placeholder="Add specific instructions for your AI employee..."
              />
            </div>
            
            <div className="voice-instruction">
              <p className="text-sm">
                🎤 Voice commands activated by saying your AI's name
              </p>
              <p className="text-sm font-bold">
                Current AI Name: <span className="text-primary">"{aiName}"</span>
              </p>
              <button
                className={`voice-button ${listening ? 'listening' : ''}`}
                onClick={toggleListening}
                style={{ marginTop: '10px', width: '100%' }}
              >
                {listening ? (
                  <>
                    <MicOff size={20} style={{ marginRight: '8px' }} />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic size={20} style={{ marginRight: '8px' }} />
                    Start Voice Commands
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Quick Templates */}
          <div className="panel-card">
            <h2 className="panel-title">
              <Rocket size={20} />
              Quick Templates
            </h2>
            
            <div className="template-grid">
              {templates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.name}
                    className={`template-btn template-${template.color} ${
                      selectedTemplate === template.name ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template.name)}
                  >
                    <Icon size={18} />
                    <div>
                      <div className="template-name">{template.name}</div>
                      <div className="template-desc">{template.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Memory Bank */}
          <div className="panel-card">
            <h2 className="panel-title">
              <Brain size={20} />
              Memory Bank
            </h2>
            
            <div className="memory-entries">
              {memoryBank.map((entry) => (
                <div key={entry.id} className="memory-entry">
                  <p>{entry.content}</p>
                  <span className="memory-timestamp">{entry.timestamp}</span>
                </div>
              ))}
              {memoryBank.length === 0 && (
                <p className="text-gray-500 text-sm">No memories recorded yet</p>
              )}
            </div>
          </div>
          
          {/* Cloud Sync Status */}
          <div className="panel-card">
            <h2 className="panel-title">
              <BarChart3 size={20} />
              Cloud Sync
            </h2>
            
            <div className="cloud-status">
              <div className="cloud-status-item">
                <div className="cloud-status-icon"></div>
                <span className="cloud-status-text">
                  {cloudSyncStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
                </span>
              </div>
              <div className="cloud-status-item">
                <Coffee size={16} />
                <span className="cloud-status-text">
                  {memoryBank.length} items
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Chat */}
        <div className="right-panel">
          <div className="panel-card">
            <h2 className="panel-title">
              <User size={20} />
              AI Employee Chat
            </h2>
            
            <div className="chat-container">
              <div className="chat-messages">
                {messages.map(renderMessage)}
                {isProcessing && (
                  <div className="message message-ai streaming">
                    <div className="message-content">
                      <p>🧠 Processing your request...</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Long Task Progress */}
              {longTaskRunning && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${longTaskProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    Long Task Progress: {longTaskProgress}%
                  </div>
                </div>
              )}
              
              <div className="input-area">
                <div className="input-container">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="chat-input"
                    placeholder="Type your message or use voice commands..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isProcessing}
                  />
                  
                  <button
                    className="send-button"
                    onClick={() => handleSendMessage()}
                    disabled={isProcessing || !inputValue.trim()}
                  >
                    <Send size={20} />
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="voice-controls">
                    <button
                      className={`voice-button ${listening ? 'listening' : ''}`}
                      onClick={toggleListening}
                    >
                      {listening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                  </div>
                  
                  <div className="long-task-controls">
                    <button
                      className={`task-button ${longTaskRunning ? 'running' : ''}`}
                      onClick={toggleLongTask}
                    >
                      {longTaskRunning ? <Square size={20} /> : <Play size={20} />}
                    </button>
                  </div>
                  
                  <button
                    className="settings-button"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;