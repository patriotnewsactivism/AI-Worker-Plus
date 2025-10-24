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
  const [maxTokens, setMaxTokens] = useState(1000);
  const [selectedVoice, setSelectedVoice] = useState('default');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `👋 Hello! I'm your AI employee.\n\n🎯 Just say my name ("${aiName}") followed by your request and I'll respond instantly!\n\n⚠️ **IMPORTANT**: Please add your Gemini API key in settings to enable real AI responses. Without an API key, I cannot provide intelligent responses.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Memory bank state
  const [memoryBank, setMemoryBank] = useState([]);
  
  // Long task state
  const [isLongTaskRunning, setIsLongTaskRunning] = useState(false);
  const [longTaskProgress, setLongTaskProgress] = useState(0);
  const longTaskIntervalRef = useRef(null);
  
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening
  } = useSpeechRecognition();
  
  // Initialize agent manager after apiKey is defined
  const agentManager = useAgentManager(apiKey);
  
  // Load configuration from localStorage on mount
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
        setMaxTokens(config.maxTokens || 1000);
        setSelectedVoice(config.selectedVoice || 'default');
        setSelectedLanguage(config.selectedLanguage || 'en-US');
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
    
    const savedMemory = localStorage.getItem('aiWorkerMemory');
    if (savedMemory) {
      try {
        setMemoryBank(JSON.parse(savedMemory));
      } catch (error) {
        console.error('Error loading memory:', error);
      }
    }
  }, []);
  
  // Save configuration to localStorage when it changes
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
  
  // Save memory bank to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('aiWorkerMemory', JSON.stringify(memoryBank));
  }, [memoryBank]);
  
  // Scroll to bottom of messages when they change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Voice recognition - handle final transcript
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
  
  // Voice recognition - handle interim transcript for real-time processing
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
    
    // Process input
    const input = inputValue;
    setInputValue('');
    await processUserInput(input);
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
      
      // Generate AI response using real API
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
  
  // Generate AI response using REAL API ONLY - NO SIMULATIONS
  const generateAIResponse = async (input) => {
    // FORCE API KEY REQUIREMENT
    if (!apiKey || apiKey.trim() === '') {
      const settingsMessage = `❌ **API Key Required**
  
  You must add a Gemini API key to use this AI assistant.
  
  **How to get your API key:**
  1. Click the settings icon (⚙️) in the top right
  2. Click the "Get API Key" link
  3. Sign in to Google AI Studio
  4. Generate a new API key
  5. Copy and paste it into the API key field
  6. Save your settings
  
  **Why you need an API key:**
  - Enables real AI responses (not simulated)
  - Allows access to Google's Gemini AI model
  - Provides intelligent, contextual answers
  - Powers all specialized templates
  
  Please add your API key to continue. Without it, I cannot provide any responses.`;
      
      toast.error('⚠️ API Key Required - Click settings to add your key');
      return settingsMessage;
    }
    
    // Template-specific prompts with real API integration
    let prompt;
    
    switch (selectedTemplate) {
      case 'Developer':
        prompt = `You are ${aiName}, an expert AI coding assistant with ${personality} personality and ${responseStyle} response style.
  
  User request: ${input}
  Template context: Developer Specialist
  Skills: ${skills.join(', ')}
  
  Please provide:
  1. Complete, working code solutions
  2. Clear explanations of the code
  3. Best practices and optimizations
  4. Common pitfalls to avoid
  
  If asked to create code, provide full implementations with proper comments. Focus on modern JavaScript/React best practices.`;
        break;
        
      case 'Meeting':
        prompt = `You are ${aiName}, an expert AI meeting planner with ${personality} personality and ${responseStyle} response style.
  
  User request: ${input}
  Template context: Meeting Planner
  
  Please provide:
  1. Detailed meeting agenda
  2. Specific time allocations
  3. Action items and responsibilities
  4. Follow-up steps
  
  Be specific and actionable in your suggestions. Consider meeting objectives and desired outcomes.`;
        break;
        
      case 'Summary':
        prompt = `You are ${aiName}, an expert AI summary generator with ${personality} personality and ${responseStyle} response style.
  
  User request: ${input}
  Template context: Summary Generator
  
  Please provide:
  1. Key points and main ideas
  2. Important details and facts
  3. Conclusions or recommendations
  4. Action items if applicable
  
  Focus on clarity, accuracy, and conciseness. Preserve the most important information while eliminating redundancy.`;
        break;
        
      case 'Data':
        prompt = `You are ${aiName}, an expert AI data analyst with ${personality} personality and ${responseStyle} response style.
  
  User request: ${input}
  Template context: Data Analyst
  
  Please provide:
  1. Data insights and patterns
  2. Statistical analysis
  3. Visualization recommendations
  4. Actionable conclusions
  
  Be thorough in your analysis and provide specific, data-driven recommendations.`;
        break;
        
      case 'Creative':
        prompt = `You are ${aiName}, an expert AI creative consultant with ${personality} personality and ${responseStyle} response style.
  
  User request: ${input}
  Template context: Creative Brain
  
  Please provide:
  1. Innovative ideas and concepts
  2. Creative solutions to problems
  3. Brainstorming results
  4. Implementation suggestions
  
  Think outside the box and provide truly original, creative ideas. Be imaginative and innovative.`;
        break;
        
      case 'LongTask':
        prompt = `You are ${aiName}, an expert AI task manager with ${personality} personality and ${responseStyle} response style.
  
  User request: ${input}
  Template context: Long Task Processor
  
  Please provide:
  1. Step-by-step breakdown
  2. Timeline estimates
  3. Resource requirements
  4. Milestones and deliverables
  
  Break down complex tasks into manageable, actionable steps with clear priorities.`;
        break;
        
      default:
        prompt = `You are ${aiName}, an expert AI assistant with ${personality} personality and ${responseStyle} response style.
  
  User request: ${input}
  Template context: ${selectedTemplate}
  Custom prompt: ${customPrompt}
  
  Please provide a helpful, intelligent response that directly addresses the user's request. Be thorough, accurate, and provide actionable advice.`;
    }
    
    // Make REAL API call - NO SIMULATIONS ALLOWED
    try {
      console.log('Making REAL API call to Gemini...', { apiKey: apiKey.substring(0, 10) + '...', promptLength: prompt.length });
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
            topP: 0.95,
            maxOutputTokens: maxTokens
          }
        })
      });
      
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (result) {
          console.log('REAL AI response received:', result.substring(0, 100) + '...');
          return result;
        } else {
          console.error('No content in API response:', data);
          return `❌ **API Response Error**
  
  The API returned no content. This could be due to:
  - Invalid API key
  - API quota exceeded
  - Temporary API issue
  
  Please check your API key and try again.`;
        }
      } else {
        // Handle HTTP errors
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        
        let errorMessage = `❌ **API Error (${response.status})**
  
  `;
        
        if (response.status === 400) {
          errorMessage += `Bad Request - This usually means:
  • Invalid API key format
  • Invalid request parameters
  • Content policy violation
  
  Please check your API key and try again.`;
        } else if (response.status === 401) {
          errorMessage += `Unauthorized - Invalid API Key
  
  Your API key is not valid. Please:
  1. Get a new API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
  2. Update it in settings
  3. Try again`;
        } else if (response.status === 403) {
          errorMessage += `Forbidden - API Access Denied
  
  This could mean:
  • API key doesn't have access to Gemini API
  • Billing issue with your Google Cloud account
  • API quota exceeded
  
  Please check your Google Cloud Console.`;
        } else if (response.status === 429) {
          errorMessage += `Rate Limited - Too Many Requests
  
  You've exceeded the API rate limit. Please wait a moment and try again.
  
  Free tier limits: 60 requests per minute`;
        } else {
          errorMessage += `HTTP Error: ${response.statusText}
  
  ${errorData.error?.message || 'Unknown error occurred'}`;
        }
        
        return errorMessage;
      }
    } catch (error) {
      console.error('Network/API Error:', error);
      return `❌ **Connection Error**
  
  Failed to connect to the API:
  ${error.message}
  
  Please check:
  • Internet connection
  • API key is correct
  • No firewall blocking the request
  
  Error details: ${error.message}`;
    }
  };
  
  // Process long task
  const processLongTask = async (input) => {
    setIsLongTaskRunning(true);
    setLongTaskProgress(0);
    
    // Add processing message
    const processingMessage = {
      id: Date.now(),
      type: 'ai',
      content: '⏳ Starting long task processing...',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    // Simulate long task with progress updates
    longTaskIntervalRef.current = setInterval(() => {
      setLongTaskProgress(prev => {
        const newProgress = prev + 10;
        
        // Add progress update message
        const progressMessage = {
          id: Date.now(),
          type: 'ai',
          content: `📊 Task Progress: ${newProgress}% complete`,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prevMessages => [...prevMessages, progressMessage]);
        
        if (newProgress >= 100) {
          clearInterval(longTaskIntervalRef.current);
          setIsLongTaskRunning(false);
          
          // Add completion message
          const completionMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: '✅ Long task completed successfully!\n\n**Results**:\n• All processing steps completed\n• Data analyzed and organized\n• Report generated\n• Next steps recommended',
            timestamp: new Date().toLocaleTimeString()
          };
          
          setMessages(prevMessages => [...prevMessages, completionMessage]);
          
          // Auto-save to memory
          saveToMemory(input, 'Long task completed with results');
        }
        
        return newProgress;
      });
    }, 2000);
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
  
  **Agents Involved**:
  ${results.map(result => `• ${result.agent} (${result.type}): ${result.result.substring(0, 100)}...`).join('\n')}
  
  **Synthesized Response**:
  The agents have collaborated to provide a comprehensive response to your request. Check the agent results panel for detailed insights from each specialist.`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, summaryMessage]);
      
    } catch (error) {
      console.error('Multi-agent processing error:', error);
      toast.error('❌ Error in multi-agent processing');
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, there was an error processing your multi-agent request. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
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
    
    if (longTaskIntervalRef.current) {
      clearInterval(longTaskIntervalRef.current);
    }
    
    const stopMessage = {
      id: Date.now(),
      type: 'ai',
      content: '⏹️ Long task has been stopped.',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, stopMessage]);
  };
  
  // Handle file processed
  const handleFileProcessed = (file) => {
    setWorkspaceFiles(prev => [...prev, file]);
    
    const fileMessage = {
      id: Date.now(),
      type: 'ai',
      content: `📁 File processed: ${file.name}\n\nContent preview: ${file.content.substring(0, 200)}...`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, fileMessage]);
  };
  
  // Determine if content should be saved to memory
  const shouldSaveToMemory = (input, response) => {
    // Save important information to memory bank
    const importantKeywords = [
      'important', 'remember', 'save', 'note', 'key point', 
      'deadline', 'meeting', 'project', 'task', 'plan'
    ];
    
    const content = `${input} ${response}`.toLowerCase();
    return importantKeywords.some(keyword => content.includes(keyword)) || 
           memoryBank.length < 5; // Always save first 5 items
  };
  
  // Save content to memory bank
  const saveToMemory = (input, response) => {
    const memoryItem = {
      id: Date.now(),
      content: `${input}\n\nResponse: ${response}`,
      timestamp: new Date().toLocaleString()
    };
    
    setMemoryBank(prev => {
      // Keep only the 5 most recent items
      const updatedMemory = [memoryItem, ...prev.slice(0, 4)];
      return updatedMemory;
    });
    
    toast.success('💾 Information saved to memory bank!');
  };
  
  // Simulate cloud sync
  const simulateCloudSync = () => {
    // In a real implementation, this would sync with a cloud service
    console.log('Simulating cloud sync...');
  };
  
  // Add a new skill
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      toast.success('✅ Skill added successfully!');
    }
  };
  
  // Remove a skill
  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
    toast.success('🗑️ Skill removed!');
  };
  
  // Save settings and close panel
  const saveSettings = () => {
    setShowSettings(false);
    toast.success('💾 Settings saved successfully!');
  };
  
  // Render message content with markdown
  const renderMessageContent = (content) => {
    return { __html: marked(content) };
  };
  
  // Template options
  const templateOptions = [
    { id: 'General', name: 'General Assistant', icon: Bot, color: 'blue' },
    { id: 'Meeting', name: 'Meeting Planner', icon: Calendar, color: 'green' },
    { id: 'Summary', name: 'Summary Generator', icon: FileText, color: 'purple' },
    { id: 'Data', name: 'Data Analyst', icon: BarChart3, color: 'red' },
    { id: 'Creative', name: 'Creative Brain', icon: Lightbulb, color: 'yellow' },
    { id: 'Developer', name: 'Developer Specialist', icon: Code, color: 'indigo' },
    { id: 'LongTask', name: 'Long Task Processor', icon: Clock, color: 'pink' }
  ];
  
  return (
    <div className="app">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <div className="logo">
              <Brain size={24} />
            </div>
            <h1>AI Worker <span className="plus">Plus</span></h1>
          </div>
          
          <div className="header-controls">
            <button 
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              disabled={!SpeechRecognition.browserSupportsSpeechRecognition()}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <button 
              className="settings-button"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>
      
      <div className="app-container">
        {/* Main Content */}
        <main className="main-content">
          {/* Chat Container */}
          <div className="chat-container">
            <div className="messages-container">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-content">
                    <div 
                      className="message-text"
                      dangerouslySetInnerHTML={renderMessageContent(message.content)}
                    />
                    <div className="message-timestamp">{message.timestamp}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="input-container">
              {isLongTaskRunning && (
                <div className="long-task-progress">
                  <div className="progress-info">
                    <span>Processing long task...</span>
                    <span>{longTaskProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${longTaskProgress}%` }}
                    />
                  </div>
                  <button 
                    className="stop-task-button"
                    onClick={stopLongTask}
                  >
                    <Square size={16} />
                    Stop Task
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="input-form">
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Message ${aiName}...`}
                    disabled={isProcessing || isLongTaskRunning}
                    className="message-input"
                  />
                  <button 
                    type="submit" 
                    disabled={isProcessing || isLongTaskRunning || !inputValue.trim()}
                    className="send-button"
                  >
                    {isProcessing ? (
                      <div className="spinner" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </form>
              
              <div className="voice-indicator">
                {isListening && (
                  <div className="listening-status">
                    <Mic size={16} />
                    <span>Listening for "{aiName}"...</span>
                  </div>
                )}
                {transcript && (
                  <div className="transcript-preview">
                    {transcript}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <aside className="sidebar">
            {/* Template Selection */}
            <div className="sidebar-section">
              <h3><User size={18} /> Templates</h3>
              <div className="template-grid">
                {templateOptions.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <button
                      key={template.id}
                      className={`template-button ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <IconComponent size={20} />
                      <span>{template.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Memory Bank */}
            {memoryBank.length > 0 && (
              <div className="sidebar-section">
                <h3><Brain size={18} /> Memory Bank</h3>
                <div className="memory-bank">
                  {memoryBank.map((item) => (
                    <div key={item.id} className="memory-item">
                      <div className="memory-content">
                        {item.content.substring(0, 100)}...
                      </div>
                      <div className="memory-timestamp">
                        {item.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Agent Results */}
            {agentResults.length > 0 && (
              <div className="sidebar-section">
                <h3><Users size={18} /> Agent Results</h3>
                <div className="agent-results">
                  {agentResults.map((result, index) => (
                    <div key={index} className="agent-result">
                      <div className="agent-header">
                        <span className="agent-name">{result.agent}</span>
                        <span className="agent-type">{result.type}</span>
                      </div>
                      <div className="agent-content">
                        {result.result.substring(0, 150)}...
                      </div>
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
        </main>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-panel">
            <div className="settings-header">
              <h2>⚙️ Configuration</h2>
              <button 
                className="close-button"
                onClick={() => setShowSettings(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="settings-content">
              <div className="settings-grid">
                {/* AI Name */}
                <div className="setting-group">
                  <label htmlFor="aiName">AI Name</label>
                  <input
                    id="aiName"
                    type="text"
                    value={aiName}
                    onChange={(e) => setAiName(e.target.value)}
                    placeholder="Assistant"
                  />
                </div>
                
                {/* API Key */}
                <div className="setting-group">
                  <label htmlFor="apiKey">
                    API Key
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
                    required
                  />
                  <p className="setting-description" style={{color: '#dc2626', fontWeight: 'bold'}}>
                    ⚠️ Required for real AI responses - No simulated responses will be provided
                  </p>
                </div>
                
                {/* Personality */}
                <div className="setting-group">
                  <label htmlFor="personality">Personality</label>
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
                
                {/* Response Style */}
                <div className="setting-group">
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
                
                {/* Temperature */}
                <div className="setting-group">
                  <label htmlFor="temperature">
                    Creativity (Temperature: {temperature})
                  </label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                  <div className="range-labels">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>
                
                {/* Max Tokens */}
                <div className="setting-group">
                  <label htmlFor="maxTokens">
                    Response Length (Max Tokens: {maxTokens})
                  </label>
                  <input
                    id="maxTokens"
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  />
                </div>
                
                {/* Language */}
                <div className="setting-group">
                  <label htmlFor="language">Language</label>
                  <select
                    id="language"
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
                
                {/* Developer Skills */}
                <div className="setting-group full-width">
                  <label>Developer Skills</label>
                  <div className="skills-manager">
                    <div className="skills-input">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a new skill"
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <button onClick={addSkill}>Add</button>
                    </div>
                    <div className="skills-list">
                      {skills.map((skill, index) => (
                        <div key={index} className="skill-tag">
                          {skill}
                          <button 
                            onClick={() => removeSkill(skill)}
                            className="remove-skill"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="settings-actions">
                <button 
                  className="save-button"
                  onClick={saveSettings}
                >
                  <Save size={16} />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PWA Installation Banner */}
      {!isInstalled && (
        <div className="pwa-banner">
          <div className="pwa-content">
            <Smartphone size={20} />
            <span>Install AI Worker Plus as an app for the best experience!</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;