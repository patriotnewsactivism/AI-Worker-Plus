import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Play, Square, Settings, Bot, Calendar, FileText, BarChart3, Lightbulb, Code, Clock, User, Brain, Coffee, Zap, Target, Rocket, Save, Globe, Volume2, Key, Smartphone, Download, Paperclip, Github, Users, PlayCircle, PauseCircle } from 'lucide-react';
import { marked } from 'marked';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Toaster, toast } from 'react-hot-toast';
import { isPWA } from './registerSW.js';
import FileUpload from './components/FileUpload.jsx';
import { useAgentManager, AGENT_TYPES } from './agents/AgentManager.jsx';
import './App.css';

function App() {
  // PWA Detection
  const [isInstalled, setIsInstalled] = useState(isPWA());
  
  // File handling state
  const [githubConnected, setGithubConnected] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  
  // Multi-agent system state
  const [agentResults, setAgentResults] = useState([]);
  
  // Configuration state
  const [aiName, setAiName] = useState('Assistant');
  const [selectedTemplate, setSelectedTemplate] = useState('General');
  const [customPrompt, setCustomPrompt] = useState('');
  const [skills, setSkills] = useState(['React', 'JavaScript', 'HTML/CSS']);
  const [newSkill, setNewSkill] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  // Advanced customization
  const [personality, setPersonality] = useState('Professional');
  const [responseStyle, setResponseStyle] = useState('Detailed');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  
  // Initialize agent manager after apiKey is defined
  const agentManager = useAgentManager(apiKey);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `👋 Hello! I'm your AI employee.

🎯 Just say my name ("${aiName}") followed by your request and I'll respond instantly!

💻 Try the "Developer" template for coding help or "Long Task" for extended processing.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLongTaskRunning, setIsLongTaskRunning] = useState(false);
  const [longTaskProgress, setLongTaskProgress] = useState(0);
  const [memoryBank, setMemoryBank] = useState([]);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle');
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Templates
  const templates = {
    General: {
      icon: Bot,
      description: 'Versatile assistant for everyday tasks',
      color: '#8b5cf6'
    },
    Meeting: {
      icon: Calendar,
      description: 'Schedule and organize meetings',
      color: '#0ea5e9'
    },
    Summary: {
      icon: FileText,
      description: 'Create summaries from content',
      color: '#10b981'
    },
    Data: {
      icon: BarChart3,
      description: 'Analyze data and create reports',
      color: '#f59e0b'
    },
    Creative: {
      icon: Lightbulb,
      description: 'Brainstorm ideas and creative solutions',
      color: '#ec4899'
    },
    Developer: {
      icon: Code,
      description: 'Coding assistance and development',
      color: '#06b6d4'
    },
    LongTask: {
      icon: Clock,
      description: 'Handle extended processing tasks',
      color: '#f97316'
    }
  };
  
  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiWorkerConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setAiName(config.aiName || 'Assistant');
        setSelectedTemplate(config.selectedTemplate || 'General');
        setCustomPrompt(config.customPrompt || '');
        setSkills(config.skills || ['React', 'JavaScript', 'HTML/CSS']);
        setApiKey(config.apiKey || '');
        setPersonality(config.personality || 'Professional');
        setResponseStyle(config.responseStyle || 'Detailed');
        setTemperature(config.temperature || 0.7);
        setMaxTokens(config.maxTokens || 500);
        setSelectedVoice(config.selectedVoice || 'default');
        setSelectedLanguage(config.selectedLanguage || 'en-US');
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);
  
  // Save configuration to localStorage
  useEffect(() => {
    const config = {
      aiName,
      selectedTemplate,
      customPrompt,
      skills,
      apiKey,
      personality,
      responseStyle,
      temperature,
      maxTokens,
      selectedVoice,
      selectedLanguage
    };
    localStorage.setItem('aiWorkerConfig', JSON.stringify(config));
  }, [aiName, selectedTemplate, customPrompt, skills, apiKey, personality, responseStyle, temperature, maxTokens, selectedVoice, selectedLanguage]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Voice recognition
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening
  } = useSpeechRecognition();
  
  // Handle voice recognition
  useEffect(() => {
    if (finalTranscript) {
      // Check if the AI name was mentioned
      if (finalTranscript.toLowerCase().includes(aiName.toLowerCase())) {
        // Extract the actual command (everything after the AI name)
        const command = finalTranscript.toLowerCase().split(aiName.toLowerCase())[1]?.trim() || finalTranscript;
        handleVoiceInput(command);
      }
      resetTranscript();
    }
  }, [finalTranscript, aiName, resetTranscript]);
  
  // Handle interim transcript for real-time processing
  useEffect(() => {
    if (interimTranscript && isListening) {
      // Check if the AI name was mentioned in interim transcript
      if (interimTranscript.toLowerCase().includes(aiName.toLowerCase())) {
        // Extract the actual command (everything after the AI name)
        const command = interimTranscript.toLowerCase().split(aiName.toLowerCase())[1]?.trim() || interimTranscript;
        if (command.length > 0) {
          handleVoiceInput(command);
        }
      }
    }
  }, [interimTranscript, aiName, isListening]);
  
  // Toggle voice listening
  const toggleListening = () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      toast.error('Browser does not support speech recognition');
      return;
    }
    
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      SpeechRecognition.startListening({ continuous: true, language: selectedLanguage });
      setIsListening(true);
      toast.success(`🎤 Listening for "${aiName}"...`);
    }
  };
  
  // Handle voice input
  const handleVoiceInput = async (command) => {
    if (!command) return;
    
    // Stop listening after processing command
    SpeechRecognition.stopListening();
    setIsListening(false);
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `🎤 Voice command: ${command}`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue(command);
    
    // Process command
    await processUserInput(command);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    
    // Process input
    await processUserInput(userInput);
  };
  
  // Process user input
  const processUserInput = async (input) => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Special handling for long tasks
      if (selectedTemplate === 'LongTask') {
        await processLongTask(input);
        return;
      }
      
      // Special handling for multi-agent tasks
      if (input.toLowerCase().includes('multi-agent') || input.toLowerCase().includes('team process')) {
        await processMultiAgentTask(input);
        return;
      }
      
      // Simulate AI response
      const aiResponse = await generateAIResponse(input);
      
      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-save important information to memory bank
      if (shouldSaveToMemory(input, aiResponse)) {
        saveToMemory(input, aiResponse);
      }
      
      // Simulate cloud sync
      simulateCloudSync();
      
    } catch (error) {
      console.error('Error processing input:', error);
      toast.error('❌ Error processing request');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Generate AI response
  const generateAIResponse = async (input) => {
    // Personality and response style prefixes
    const personalityPrefixes = {
      Professional: 'As a professional AI assistant',
      Friendly: 'Hello there! As your friendly AI assistant',
      Expert: 'As an expert in the field',
      Concise: ''
    };
    
    const responseStylePrefixes = {
      Detailed: 'Here is a comprehensive response',
      Concise: 'In brief',
      Creative: 'Thinking creatively',
      Technical: 'From a technical perspective'
    };
    
    const personalityPrefix = personalityPrefixes[personality] || personalityPrefixes.Professional;
    const responseStylePrefix = responseStylePrefixes[responseStyle] || responseStylePrefixes.Detailed;
    
    // Template-specific responses
    switch (selectedTemplate) {
      case 'Developer':
        return `${personalityPrefix} ${responseStylePrefix}

**Developer Specialist Activated**

I can help create applications and solve coding challenges.

\`\`\`jsx
// Example React component
function AIWorker() {
  return (
    <div className="ai-worker">
      <h1>Welcome to AI Worker Plus</h1>
      <button onClick={handleVoiceCommand}>
        Click for voice activation
      </button>
    </div>
  );
}
\`\`\`

What specific coding task would you like me to help with today?`;
        
      case 'Meeting':
        return `${personalityPrefix} ${responseStylePrefix}

**Meeting Planner Activated**

I can help you schedule and organize meetings.

📅 **Meeting Plan for**: ${input}

**Suggested Agenda**:
1. Introduction and objectives
2. Key discussion points
3. Action items and responsibilities
4. Next steps and follow-up

**Recommended Duration**: 30-45 minutes
**Suggested Participants**: Relevant team members

Would you like me to create a detailed meeting agenda?`;
        
      case 'Summary':
        return `${personalityPrefix} ${responseStylePrefix}

**Summary Generator Activated**

Here's a summary of the content you mentioned:

---

**${input.substring(0, 30)}...**

This appears to be an important topic that requires summarization. A good summary should include:

• Key points and main ideas
• Important details and facts
• Conclusions or recommendations
• Action items if applicable

Would you like me to create a more detailed summary of specific content?`;
        
      case 'Data':
        return `${personalityPrefix} ${responseStylePrefix}

**Data Analyst Activated**

📊 **Data Analysis Request**: ${input}

Based on your request, here's an analytical approach:

**Key Metrics to Consider**:
• Performance indicators
• Trends and patterns
• Comparative analysis
• Statistical significance

**Recommended Visualization**:
• Bar charts for comparisons
• Line graphs for trends
• Pie charts for distributions
• Heatmaps for correlations

Would you like me to help analyze specific data sets?`;
        
      case 'Creative':
        return `${personalityPrefix} ${responseStylePrefix}

**Creative Brain Activated**

🎨 **Creative Challenge**: ${input}

Here are some innovative ideas:

1. **Concept A**: Revolutionary approach focusing on user experience
2. **Concept B**: Sustainable solution with environmental benefits
3. **Concept C**: Technology-driven innovation using AI
4. **Concept D**: Community-centered design promoting engagement

**Next Steps**:
• Develop detailed concept sketches
• Create prototypes for testing
• Gather feedback from target audience
• Refine based on insights

Which concept interests you most?`;
        
      default:
        // Simulate API call to Gemini
        if (apiKey) {
          try {
            const prompt = `You are ${aiName}, an AI assistant with ${personality} personality and ${responseStyle} response style.
            
User request: ${input}
            
Template context: ${selectedTemplate}
            
Please provide a helpful response.`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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
                  temperature: temperature,
                  maxOutputTokens: maxTokens,
                  topK: 1,
                }
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
            }
          } catch (error) {
            console.error('API Error:', error);
            // Fall back to simulated response
          }
        }
        
        // Simulated response
        return `${personalityPrefix} ${responseStylePrefix}

I understand you're asking about "${input}". This is an interesting topic that I can help with.

Based on my analysis:
• Key considerations have been identified
• Multiple approaches are available
• Implementation steps can be outlined
• Potential challenges can be addressed

How would you like me to proceed with helping you on this matter?`;
    }
  };
  
  // Process long task
  const processLongTask = async (input) => {
    setIsLongTaskRunning(true);
    setLongTaskProgress(0);
    
    // Simulate long task with progress updates
    const steps = [
      'Initializing task processing...',
      'Analyzing requirements...',
      'Gathering resources...',
      'Executing primary operations...',
      'Processing intermediate results...',
      'Validating outputs...',
      'Finalizing results...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      // Add progress message
      const progressMessage = {
        id: Date.now() + i,
        type: 'ai',
        content: `⏳ ${steps[i]}`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, progressMessage]);
      
      // Update progress
      const progress = Math.round(((i + 1) / steps.length) * 100);
      setLongTaskProgress(progress);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Add final result
    const resultMessage = {
      id: Date.now() + steps.length,
      type: 'ai',
      content: `✅ Long task completed successfully!

**Task**: ${input}

**Results**:
• All operations executed successfully
• Results have been validated
• Output files generated
• Process completed within expected timeframe

Is there anything specific about the results you'd like me to explain?`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, resultMessage]);
    setIsLongTaskRunning(false);
    setLongTaskProgress(0);
  };
  
  // Process multi-agent task
  const processMultiAgentTask = async (input) => {
    if (!apiKey) {
      toast.error('API key required for multi-agent processing');
      return;
    }
    
    // Add processing message
    const processingMessage = {
      id: Date.now(),
      type: 'ai',
      content: '🤖 Initiating multi-agent processing...',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    try {
      // Process task with active agents
      const results = await agentManager.processTaskWithAgents(
        input,
        `Context: User requested multi-agent processing. Template: ${selectedTemplate}`
      );
      
      // Handle results
      handleAgentResults(results);
      
      // Add summary message
      const summaryMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `## 🤖 Multi-Agent Processing Complete

**Task**: ${input}

**Agent Results**:
${results.map(result => `
### ${result.agent} (${result.type})
${result.result.substring(0, 200)}${result.result.length > 200 ? '...' : ''}`).join('')}

**Next Steps**:
• Review individual agent contributions
• Synthesize key insights
• Identify action items
• Plan implementation strategy

Would you like me to elaborate on any specific agent's results?`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Multi-agent processing error:', error);
      toast.error('❌ Error in multi-agent processing');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `Error in multi-agent processing: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  // Determine if content should be saved to memory
  const shouldSaveToMemory = (input, response) => {
    const importantKeywords = [
      'important', 'remember', 'note', 'save', 'record', 'schedule',
      'meeting', 'deadline', 'project', 'task', 'action item'
    ];
    
    const content = (input + ' ' + response).toLowerCase();
    return importantKeywords.some(keyword => content.includes(keyword));
  };
  
  // Save to memory bank
  const saveToMemory = (input, response) => {
    const memoryItem = {
      id: Date.now(),
      content: `${input} - ${response.substring(0, 100)}...`,
      timestamp: new Date().toLocaleString()
    };
    
    setMemoryBank(prev => {
      const newMemory = [memoryItem, ...prev].slice(0, 5); // Keep only 5 most recent items
      return newMemory;
    });
    
    toast.success('💾 Saved to memory bank');
  };
  
  // Simulate cloud sync
  const simulateCloudSync = () => {
    setCloudSyncStatus('syncing');
    setTimeout(() => {
      setCloudSyncStatus('synced');
      setTimeout(() => {
        setCloudSyncStatus('idle');
      }, 2000);
    }, 1500);
  };
  
  // Add new skill
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      toast.success('✅ Skill added successfully');
    }
  };
  
  // Remove skill
  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
    toast.success('🗑️ Skill removed');
  };
  
  // Save settings and close panel
  const saveSettings = () => {
    toast.success('✅ Settings saved successfully');
    setShowSettings(false);
  };
  
  // Handle file processing from FileUpload component
  const handleFileProcessed = (fileData) => {
    console.log('File processed:', fileData);
    // Add file to workspace files
    setWorkspaceFiles(prev => [...prev, fileData]);
    toast.success(`📁 File processed: ${fileData.name}`);
  };
  
  // Handle agent results
  const handleAgentResults = (results) => {
    console.log('Agent results:', results);
    setAgentResults(results);
    toast.success('🤖 Multi-agent processing completed!');
  };
  
  // Handle GitHub connection
  const handleGitHubConnect = () => {
    // Simulate GitHub connection
    setGithubConnected(true);
    toast.success('🔗 GitHub connected successfully!');
  };
  
  // Handle voice command (referenced in Developer template)
  const handleVoiceCommand = () => {
    if (!listening) {
      toggleListening();
    }
  };
  
  // Stop long task
  const stopLongTask = () => {
    setIsLongTaskRunning(false);
    setLongTaskProgress(0);
    
    const stopMessage = {
      id: Date.now(),
      type: 'ai',
      content: '⏹️ Long task has been stopped.',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, stopMessage]);
  };
  
  // Render chat message
  const renderMessage = (message) => {
    if (message.type === 'ai') {
      return (
        <div className="message ai-message" key={message.id}>
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
        <div className="message user-message" key={message.id}>
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
  };
  
  // Get cloud sync status icon
  const getCloudSyncIcon = () => {
    switch (cloudSyncStatus) {
      case 'syncing':
        return '🔄';
      case 'synced':
        return '✅';
      default:
        return '☁️';
    }
  };
  
  return (
    <div className="app">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-logo">
            <Brain className="logo-icon" size={24} />
            <h1>AI Worker <span className="plus">Plus</span></h1>
          </div>
          
          <div className="header-controls">
            <div className={`cloud-status ${cloudSyncStatus}`} title={`Cloud status: ${cloudSyncStatus}`}>
              {getCloudSyncIcon()}
            </div>
            
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3><Users size={18} /> AI Templates</h3>
            <div className="template-grid">
              {Object.entries(templates).map(([key, template]) => {
                const IconComponent = template.icon;
                return (
                  <button
                    key={key}
                    className={`template-btn ${selectedTemplate === key ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate(key)}
                    style={{ '--template-color': template.color }}
                  >
                    <IconComponent size={20} />
                    <span>{key}</span>
                    <small>{template.description}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Memory Bank */}
          {memoryBank.length > 0 && (
            <div className="sidebar-section">
              <h3><Coffee size={18} /> Memory Bank</h3>
              <div className="memory-bank">
                {memoryBank.map(item => (
                  <div key={item.id} className="memory-item">
                    <div className="memory-content">{item.content}</div>
                    <div className="memory-timestamp">{item.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Workspace */}
          <div className="sidebar-section">
            <FileUpload 
              onFileProcessed={handleFileProcessed}
              githubConnected={githubConnected}
              onGitHubConnect={handleGitHubConnect}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <Zap size={16} />
              <span>{messages.length} Messages</span>
            </div>
            <div className="stat-item">
              <Target size={16} />
              <span>{memoryBank.length} Memories</span>
            </div>
            <div className="stat-item">
              <Rocket size={16} />
              <span>{workspaceFiles.length} Files</span>
            </div>
            <div className="stat-item">
              <Globe size={16} />
              <span>{isInstalled ? 'Installed' : 'Web App'}</span>
            </div>
          </div>

          {/* Chat Container */}
          <div className="chat-container">
            <div className="messages">
              {messages.map(renderMessage)}
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
                  ref={inputRef}
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
        </main>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-panel">
            <div className="settings-header">
              <h2><Settings size={24} /> Configuration</h2>
              <button 
                className="close-btn"
                onClick={() => setShowSettings(false)}
                title="Close settings"
              >
                ×
              </button>
            </div>
            
            <div className="settings-content">
              <div className="settings-section">
                <h3>Basic Settings</h3>
                
                <div className="form-group">
                  <label htmlFor="aiName">AI Assistant Name</label>
                  <input
                    id="aiName"
                    type="text"
                    value={aiName}
                    onChange={(e) => setAiName(e.target.value)}
                    placeholder="Enter AI name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="apiKey">
                    Gemini API Key 
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="api-key-link"
                    >
                      Get API Key
                    </a>
                  </label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                  />
                  <small>Required for advanced AI features</small>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>Advanced Customization</h3>
                
                <div className="form-group">
                  <label htmlFor="personality">AI Personality</label>
                  <select
                    id="personality"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                  >
                    <option value="Professional">Professional</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Expert">Expert</option>
                    <option value="Concise">Concise</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="responseStyle">Response Style</label>
                  <select
                    id="responseStyle"
                    value={responseStyle}
                    onChange={(e) => setResponseStyle(e.target.value)}
                  >
                    <option value="Detailed">Detailed</option>
                    <option value="Concise">Concise</option>
                    <option value="Creative">Creative</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="temperature">Creativity (Temperature)</label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                  <span className="range-value">{temperature}</span>
                </div>
                
                <div className="form-group">
                  <label htmlFor="maxTokens">Response Length (Max Tokens)</label>
                  <input
                    id="maxTokens"
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  />
                  <span className="range-value">{maxTokens}</span>
                </div>
                
                <div className="form-group">
                  <label htmlFor="selectedVoice">Voice Selection</label>
                  <select
                    id="selectedVoice"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="alice">Alice</option>
                    <option value="bob">Bob</option>
                    <option value="samantha">Samantha</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="selectedLanguage">Language</label>
                  <select
                    id="selectedLanguage"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                  </select>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>Template Customization</h3>
                
                <div className="form-group">
                  <label htmlFor="customPrompt">Custom Instructions</label>
                  <textarea
                    id="customPrompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Add custom instructions for your AI assistant..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="settings-section">
                <h3>Developer Specialist Skills</h3>
                <div className="skills-manager">
                  <div className="skill-input">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a new skill"
                    />
                    <button onClick={addSkill} className="add-skill-btn">
                      Add
                    </button>
                  </div>
                  <div className="skills-list">
                    {skills.map((skill, index) => (
                      <div key={index} className="skill-tag">
                        {skill}
                        <button 
                          onClick={() => removeSkill(skill)}
                          className="remove-skill-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="settings-footer">
              <button 
                onClick={saveSettings}
                className="save-btn"
              >
                <Save size={18} /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;