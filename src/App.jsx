import { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Copy, FileDown, Trash2, Save, Upload, 
  Settings, Moon, Briefcase, Microscope, TrendingUp, Palette,
  Clock, MessageSquare, FileText, Plus, X, Loader, Mic, MicOff,
  Database, Cloud, Code, Play, Pause, Square, FolderOpen,
  Download, Share2, AlertCircle
} from 'lucide-react';
import { marked } from 'marked';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

// Templates
const templates = {
  assistant: {
    role: 'Personal Assistant',
    skills: 'Scheduling, Email Management, Task Coordination',
    instructions: 'Act as a professional personal assistant. Be organized, proactive, and helpful. Manage tasks efficiently and communicate clearly. Help with memory and organizational issues.'
  },
  researcher: {
    role: 'Research Analyst',
    skills: 'Data Analysis, Literature Review, Critical Thinking',
    instructions: 'Act as a skilled research analyst. Provide evidence-based insights, cite sources, and maintain objectivity in your analysis.'
  },
  analyst: {
    role: 'Business Analyst',
    skills: 'Data Visualization, Market Research, Strategic Planning',
    instructions: 'Act as a business analyst. Focus on data-driven insights, identify trends, and provide actionable recommendations.'
  },
  creative: {
    role: 'Creative Director',
    skills: 'Ideation, Design Thinking, Storytelling',
    instructions: 'Act as a creative professional. Think outside the box, provide innovative solutions, and express ideas vividly.'
  },
  coder: {
    role: 'Senior Developer',
    skills: 'React, JavaScript, HTML/CSS, Node.js, Python, Database Design',
    instructions: 'Act as an expert software developer. Write clean, efficient code with proper documentation. Help create apps, websites, and solve complex programming challenges. Always provide complete, working solutions.'
  }
};

const messageTemplates = {
  meeting: 'Please help me prepare for the upcoming meeting about [topic]. I need to discuss: [key points]',
  summary: 'Please summarize the following information: [paste text here]',
  analysis: 'Analyze this data/situation and provide insights: [details]',
  creative: 'Help me brainstorm creative ideas for [project/goal]',
  code: 'Create a [type of app/website] that [requirements]. Include proper error handling and responsive design.',
  task: 'I need you to work on a long-running task: [description]. Please work independently and provide updates as needed.'
};

function App() {
  // State management
  const [aiRole, setAiRole] = useState('Personal Assistant');
  const [aiSkills, setAiSkills] = useState('');
  const [skillTags, setSkillTags] = useState(['Scheduling', 'Task Management']);
  const [aiInstructions, setAiInstructions] = useState('Act as a professional personal assistant. Be organized, proactive, and helpful. Manage tasks efficiently and communicate clearly. Help with memory and organizational issues.');
  const [aiTone, setAiTone] = useState('professional');
  const [taskInput, setTaskInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [aiName, setAiName] = useState('Assistant');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [longRunningTask, setLongRunningTask] = useState(null);
  const [taskProgress, setTaskProgress] = useState(0);
  const [taskStatus, setTaskStatus] = useState('');
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [memoryEntries, setMemoryEntries] = useState([]);

  const chatContainerRef = useRef(null);
  const sessionStartTime = useRef(Date.now());
  const listeningTimeoutRef = useRef(null);

  // Speech recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Load saved configuration on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai-employee-config');
    if (saved) {
      const config = JSON.parse(saved);
      setAiRole(config.role || 'Personal Assistant');
      setAiSkills(config.skills || '');
      setSkillTags(config.skillTags || ['Scheduling', 'Task Management']);
      setAiInstructions(config.instructions || 'Act as a professional personal assistant. Be organized, proactive, and helpful. Manage tasks efficiently and communicate clearly. Help with memory and organizational issues.');
      setAiTone(config.tone || 'professional');
      setAiName(config.aiName || 'Assistant');
    }

    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    const savedMemory = localStorage.getItem('ai-memory-entries');
    if (savedMemory) {
      setMemoryEntries(JSON.parse(savedMemory));
    }
  }, []);

  // Update session time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartTime.current;
      setSessionTime(Math.floor(elapsed / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Handle speech recognition transcript
  useEffect(() => {
    if (transcript && isListening) {
      // Check if the AI's name was mentioned
      if (transcript.toLowerCase().includes(aiName.toLowerCase())) {
        // Process the transcript as a command to the AI
        handleVoiceCommand(transcript);
      } else {
        // Store the transcript as a memory entry for organizational help
        addMemoryEntry(transcript);
      }
    }
  }, [transcript, isListening, aiName]);

  // Handle voice command
  const handleVoiceCommand = async (command) => {
    // Remove the AI name from the command
    const cleanCommand = command.replace(new RegExp(aiName, 'gi'), '').trim();
    
    if (cleanCommand) {
      setIsProcessing(true);
      setTaskInput(cleanCommand);
      
      // Add a slight delay to show processing
      setTimeout(() => {
        generateResponse(false);
        setIsProcessing(false);
      }, 1000);
    }
  };

  // Add memory entry
  const addMemoryEntry = (text) => {
    if (text.trim()) {
      const newEntry = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString()
      };
      
      const updatedEntries = [newEntry, ...memoryEntries.slice(0, 9)]; // Keep only last 10 entries
      setMemoryEntries(updatedEntries);
      localStorage.setItem('ai-memory-entries', JSON.stringify(updatedEntries));
      
      // Show notification for memory entry
      toast.success(`Memory recorded: ${text.substring(0, 30)}...`, {
        duration: 2000,
        icon: '🧠'
      });
    }
  };

  // Toggle speech recognition
  const toggleListening = () => {
    if (!browserSupportsSpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      resetTranscript();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      setIsListening(true);
      
      // Auto-stop listening after 10 minutes to save resources
      if (listeningTimeoutRef.current) {
        clearTimeout(listeningTimeoutRef.current);
      }
      
      listeningTimeoutRef.current = setTimeout(() => {
        if (isListening) {
          SpeechRecognition.stopListening();
          setIsListening(false);
          resetTranscript();
          toast('Listening auto-stopped after 10 minutes', {
            icon: '⏰'
          });
        }
      }, 600000); // 10 minutes
    }
  };

  // Load template
  const loadTemplate = (type) => {
    const template = templates[type];
    if (template) {
      setAiRole(template.role);
      setAiSkills(template.skills);
      setAiInstructions(template.instructions);
      showNotification('Template loaded successfully!', 'success');
    }
  };

  // Insert message template
  const insertTemplate = (type) => {
    const template = messageTemplates[type];
    if (template) {
      setTaskInput(template);
    }
  };

  // Add skill tag
  const addSkillTag = () => {
    const skill = aiSkills.trim();
    if (skill && !skillTags.includes(skill)) {
      setSkillTags([...skillTags, skill]);
      setAiSkills('');
    }
  };

  // Remove skill tag
  const removeSkillTag = (skill) => {
    setSkillTags(skillTags.filter(s => s !== skill));
  };

  // Generate response
  const generateResponse = async (isFollowUp = false) => {
    if (!aiRole.trim() || !taskInput.trim()) {
      setError('AI Role and message cannot be empty.');
      return;
    }

    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      setError('Please enter your Gemini API key to continue.');
      return;
    }

    let newHistory = isFollowUp ? [...chatHistory] : [];
    
    const userMessage = { role: 'user', parts: [{ text: taskInput }] };
    newHistory.push(userMessage);
    
    if (!isFollowUp) {
      setChatHistory(newHistory);
    } else {
      setChatHistory(newHistory);
    }

    setTaskInput('');
    setIsLoading(true);
    setError('');

    // Sync conversation to cloud
    syncConversationToCloud(newHistory);

    const systemPrompt = `You are an AI assistant named ${aiName}. Role: ${aiRole}. Skills: ${aiSkills}, ${skillTags.join(', ')}. Instructions: ${aiInstructions}. Tone: ${aiTone}. Respond appropriately with detailed, helpful information.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const payload = {
      contents: newHistory,
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (candidate && candidate.content?.parts?.[0]?.text) {
        const modelResponse = candidate.content.parts[0].text;
        const aiMessage = { role: 'model', parts: [{ text: modelResponse }] };
        
        setChatHistory([...newHistory, aiMessage]);
        setMessageCount(prev => prev + 2);
        setWordCount(prev => prev + modelResponse.split(/\s+/).length);
      } else {
        throw new Error('Failed to get a valid response from the AI.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync conversation to cloud (simulated)
  const syncConversationToCloud = async (history) => {
    setCloudSyncStatus('syncing');
    
    // In a real implementation, this would sync to Google Cloud or AWS
    // For now, we'll simulate the process
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCloudSyncStatus('synced');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setCloudSyncStatus('idle');
      }, 3000);
    } catch (err) {
      setCloudSyncStatus('error');
      console.error('Cloud sync error:', err);
    }
  };

  // Start long-running task
  const startLongRunningTask = async () => {
    if (!taskInput.trim()) {
      setError('Please enter a task description.');
      return;
    }

    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      setError('Please enter your Gemini API key to continue.');
      return;
    }

    setLongRunningTask({
      id: Date.now(),
      description: taskInput,
      status: 'running',
      progress: 0
    });
    
    setTaskStatus('Task started. Working on it...');
    setTaskProgress(0);
    
    // Simulate a long-running task
    const taskInterval = setInterval(() => {
      setTaskProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(taskInterval);
          setTaskStatus('Task completed successfully!');
          showNotification('Long-running task completed!', 'success');
          return 100;
        }
        setTaskStatus(`Working on task... ${newProgress}% complete`);
        return newProgress;
      });
    }, 2000);
  };

  // Stop long-running task
  const stopLongRunningTask = () => {
    setLongRunningTask(null);
    setTaskProgress(0);
    setTaskStatus('');
    showNotification('Task stopped.', 'info');
  };

  // Clear conversation
  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setChatHistory([]);
      setMessageCount(0);
      setWordCount(0);
      sessionStartTime.current = Date.now();
      setSessionTime(0);
      showNotification('Conversation cleared', 'info');
    }
  };

  // Copy conversation
  const copyConversation = () => {
    const conversationText = chatHistory
      .map(turn => `${turn.role === 'user' ? 'You' : 'AI Employee'}:\n${turn.parts[0].text}`)
      .join('\n\n');

    if (!conversationText) {
      setError('No conversation to copy.');
      return;
    }

    navigator.clipboard.writeText(conversationText).then(() => {
      showNotification('Conversation copied to clipboard!', 'success');
    });
  };

  // Export chat
  const exportChat = () => {
    const conversationData = {
      timestamp: new Date().toISOString(),
      role: aiRole,
      skills: aiSkills,
      skillTags: skillTags,
      instructions: aiInstructions,
      tone: aiTone,
      aiName: aiName,
      chatHistory: chatHistory,
      statistics: {
        messageCount,
        wordCount,
        sessionTime
      }
    };

    const dataStr = JSON.stringify(conversationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-conversation-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Chat exported successfully!', 'success');
  };

  // Save configuration
  const saveConfiguration = () => {
    const config = {
      role: aiRole,
      skills: aiSkills,
      skillTags: skillTags,
      instructions: aiInstructions,
      tone: aiTone,
      aiName: aiName
    };

    localStorage.setItem('ai-employee-config', JSON.stringify(config));
    showNotification('Configuration saved!', 'success');
  };

  // Load configuration
  const loadConfiguration = () => {
    const saved = localStorage.getItem('ai-employee-config');
    if (saved) {
      const config = JSON.parse(saved);
      setAiRole(config.role || 'Personal Assistant');
      setAiSkills(config.skills || '');
      setSkillTags(config.skillTags || ['Scheduling', 'Task Management']);
      setAiInstructions(config.instructions || 'Act as a professional personal assistant. Be organized, proactive, and helpful. Manage tasks efficiently and communicate clearly. Help with memory and organizational issues.');
      setAiTone(config.tone || 'professional');
      setAiName(config.aiName || 'Assistant');
      showNotification('Configuration loaded!', 'success');
    } else {
      setError('No saved configuration found.');
    }
  };

  // Save API key
  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini-api-key', apiKey);
      setShowApiKeyInput(false);
      showNotification('API key saved!', 'success');
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    toast(message, {
      icon: type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    });
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateResponse(false);
    }
  };

  // Render markdown
  const renderMarkdown = (text) => {
    return { __html: marked(text) };
  };

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <div className="logo-circle">
              <Bot size={24} />
            </div>
            <div>
              <h1>AI Employee Creator Pro</h1>
              <p>Build intelligent AI assistants with custom personas</p>
            </div>
          </div>
          <div className="header-stats">
            <span className="stat-badge">
              <User size={14} /> 10k+ Users
            </span>
            <span className="stat-badge">⭐ 4.9 Rating</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Left Panel: Configuration */}
        <aside className="config-panel">
          <div className="panel-card">
            <h2 className="panel-title">
              <Settings size={20} />
              AI Employee Configuration
            </h2>

            {/* API Key Input */}
            {showApiKeyInput && (
              <div className="api-key-section">
                <label>Gemini API Key</label>
                <div className="api-key-input-group">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="input-field"
                  />
                  <button onClick={saveApiKey} className="btn btn-primary btn-sm">
                    <Save size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600">
                    Google AI Studio
                  </a>
                </p>
              </div>
            )}

            {/* AI Name */}
            <div className="section">
              <label htmlFor="ai-name">AI Employee Name</label>
              <input
                id="ai-name"
                type="text"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                placeholder="e.g., Assistant, Jarvis"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                The AI will only respond when this name is mentioned in voice commands
              </p>
            </div>

            {/* Quick Templates */}
            <div className="section">
              <label>Quick Templates</label>
              <div className="template-grid">
                <button onClick={() => loadTemplate('assistant')} className="template-btn template-blue">
                  <Briefcase size={16} /> Assistant
                </button>
                <button onClick={() => loadTemplate('researcher')} className="template-btn template-green">
                  <Microscope size={16} /> Researcher
                </button>
                <button onClick={() => loadTemplate('analyst')} className="template-btn template-purple">
                  <TrendingUp size={16} /> Analyst
                </button>
                <button onClick={() => loadTemplate('creative')} className="template-btn template-pink">
                  <Palette size={16} /> Creative
                </button>
                <button onClick={() => loadTemplate('coder')} className="template-btn template-orange">
                  <Code size={16} /> Developer
                </button>
              </div>
            </div>

            {/* Configuration Fields */}
            <div className="section">
              <label htmlFor="ai-role">Role / Job Title</label>
              <input
                id="ai-role"
                type="text"
                value={aiRole}
                onChange={(e) => setAiRole(e.target.value)}
                placeholder="e.g., Legal Research Assistant"
                className="input-field"
              />
            </div>

            <div className="section">
              <label htmlFor="ai-skills">Key Skills</label>
              <div className="skill-input-group">
                <input
                  id="ai-skills"
                  type="text"
                  value={aiSkills}
                  onChange={(e) => setAiSkills(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkillTag()}
                  placeholder="e.g., Constitutional law"
                  className="input-field"
                />
                <button onClick={addSkillTag} className="btn btn-primary btn-icon">
                  <Plus size={18} />
                </button>
              </div>
              <div className="skill-tags">
                {skillTags.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button onClick={() => removeSkillTag(skill)} className="skill-tag-remove">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="section">
              <label htmlFor="ai-instructions">Core Instructions (Persona)</label>
              <textarea
                id="ai-instructions"
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="e.g., Act as a highly skilled paralegal..."
                rows="4"
                className="input-field"
              />
            </div>

            <div className="section">
              <label htmlFor="ai-tone">Response Tone</label>
              <select
                id="ai-tone"
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="input-field"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="creative">Creative</option>
              </select>
            </div>

            {/* Save/Load Buttons */}
            <div className="button-group">
              <button onClick={saveConfiguration} className="btn btn-secondary">
                <Save size={16} /> Save
              </button>
              <button onClick={loadConfiguration} className="btn btn-secondary">
                <Upload size={16} /> Load
              </button>
            </div>
          </div>

          {/* Memory Panel */}
          <div className="panel-card stats-card">
            <h3 className="panel-title">
              <Database size={18} />
              Memory Bank
            </h3>
            <div className="memory-entries">
              {memoryEntries.length > 0 ? (
                memoryEntries.map(entry => (
                  <div key={entry.id} className="memory-entry">
                    <p>{entry.text}</p>
                    <span className="memory-timestamp">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No memory entries yet. The AI will record important information here.</p>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="panel-card stats-card">
            <h3 className="panel-title">
              <TrendingUp size={18} />
              Session Statistics
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Messages</span>
                <span className="stat-value">{messageCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Words Generated</span>
                <span className="stat-value">{wordCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Session Time</span>
                <span className="stat-value">{formatTime(sessionTime)}</span>
              </div>
            </div>
            
            <div className="cloud-status">
              <div className="flex items-center gap-2">
                <Cloud size={16} />
                <span>Cloud Sync:</span>
              </div>
              <div className={`sync-status ${cloudSyncStatus}`}>
                {cloudSyncStatus === 'idle' && 'Idle'}
                {cloudSyncStatus === 'syncing' && 'Syncing...'}
                {cloudSyncStatus === 'synced' && 'Synced'}
                {cloudSyncStatus === 'error' && 'Error'}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel: Chat Interface */}
        <section className="chat-panel">
          <div className="chat-container">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="avatar">
                  <Bot size={20} />
                </div>
                <div>
                  <h3>{aiRole || 'AI Employee'}</h3>
                  <p>{aiName} - Ready to assist</p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button 
                  onClick={toggleListening}
                  className={`icon-btn ${isListening ? 'listening' : ''}`}
                  title={isListening ? "Stop listening" : "Start listening"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button onClick={() => setShowApiKeyInput(!showApiKeyInput)} className="icon-btn">
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="chat-messages">
              {chatHistory.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} className="empty-icon" />
                  <p>Start a conversation with your AI employee</p>
                  <p className="empty-subtitle">Configure your AI assistant in the left panel</p>
                  <div className="voice-instruction">
                    <p>🎙️ Voice commands enabled! Say "{aiName}" followed by your request.</p>
                    <p className="text-sm mt-2">The AI will also record important information to help with memory issues.</p>
                  </div>
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div key={index} className={`message ${message.role === 'user' ? 'message-user' : 'message-ai'}`}>
                    <div className="message-sender">
                      {message.role === 'user' ? 'You' : 'AI Employee'}
                    </div>
                    <div className="message-bubble">
                      {message.role === 'model' ? (
                        <div 
                          className="markdown-content"
                          dangerouslySetInnerHTML={renderMarkdown(message.parts[0].text)}
                        />
                      ) : (
                        <p>{message.parts[0].text}</p>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="loading-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>AI is thinking...</span>
                </div>
              )}
              
              {/* Processing Voice Command */}
              {isProcessing && (
                <div className="loading-indicator">
                  <Loader size={20} className="animate-spin" />
                  <span>Processing voice command...</span>
                </div>
              )}
            </div>

            {/* Long-running Task Status */}
            {longRunningTask && (
              <div className="task-status">
                <div className="task-header">
                  <h4>Long-running Task</h4>
                  <button onClick={stopLongRunningTask} className="btn btn-sm btn-danger">
                    <Square size={14} /> Stop
                  </button>
                </div>
                <p className="task-description">{longRunningTask.description}</p>
                <div className="task-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${taskProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{taskProgress}%</span>
                </div>
                <p className="task-status-text">{taskStatus}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <p>{error}</p>
                <button onClick={() => setError('')} className="error-close">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="chat-input-area">
              <div className="quick-templates">
                <button onClick={() => insertTemplate('meeting')} className="quick-template-btn">
                  📅 Meeting
                </button>
                <button onClick={() => insertTemplate('summary')} className="quick-template-btn">
                  📄 Summary
                </button>
                <button onClick={() => insertTemplate('analysis')} className="quick-template-btn">
                  📊 Analysis
                </button>
                <button onClick={() => insertTemplate('creative')} className="quick-template-btn">
                  💡 Creative
                </button>
                <button onClick={() => insertTemplate('code')} className="quick-template-btn">
                  💻 Code
                </button>
                <button onClick={() => insertTemplate('task')} className="quick-template-btn">
                  ⏱️ Long Task
                </button>
              </div>

              <div className="input-group">
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  rows="3"
                  className="chat-input"
                />
                <div className="input-actions">
                  <button 
                    onClick={startLongRunningTask}
                    className="btn btn-secondary btn-icon"
                    title="Start long-running task"
                  >
                    <Play size={18} />
                  </button>
                  <button 
                    onClick={() => generateResponse(false)} 
                    disabled={isLoading}
                    className="btn btn-primary btn-send"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <div className="action-buttons-left">
                  <button onClick={() => generateResponse(true)} disabled={isLoading} className="btn btn-sm btn-success">
                    Continue
                  </button>
                  <button onClick={clearConversation} className="btn btn-sm btn-secondary">
                    <Trash2 size={14} /> Clear
                  </button>
                </div>
                <div className="action-buttons-right">
                  <button onClick={copyConversation} className="btn btn-sm btn-secondary">
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={exportChat} className="btn btn-sm btn-secondary">
                    <FileDown size={14} /> Export
                  </button>
                  <button onClick={() => {}} className="btn btn-sm btn-secondary">
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>⚡ Powered by Gemini AI</span>
          <span>🔒 Secure & Private</span>
          <span>💻 Version 2.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;