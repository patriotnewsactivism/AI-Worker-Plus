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
      content: `👋 Hello! I'm your AI employee.\n\n🎯 Just say my name ("${aiName}") followed by your request and I'll respond instantly!\n\n💡 Try asking me to help with coding, research, planning, or any other task!`,
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
  
  // Generate AI response using real API
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
    
    // Template-specific responses with real API integration
    switch (selectedTemplate) {
      case 'Developer':
        // Use real API for developer template
        if (apiKey) {
          try {
            const prompt = `You are ${aiName}, an AI coding assistant with ${personality} personality and ${responseStyle} response style.
            
User request: ${input}
Template context: Developer Specialist
Skills: ${skills.join(', ')}

Please provide code solutions, explanations, and best practices. If asked to create code, provide complete, working examples with proper comments.`;
            
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
          }
        }
        
        // Fallback response for developer template
        return `${personalityPrefix} ${responseStylePrefix}

**Developer Specialist Activated**

I can help create applications and solve coding challenges.

\`\`\`jsx
// Example React component
function AIWorker() {
  return (
    <div>
      <h1>AI Worker Plus</h1>
      <p>Your intelligent assistant for development tasks</p>
    </div>
  );
}
\`\`\`

What specific coding task would you like me to help with?`;
        
      case 'Meeting':
        return `${personalityPrefix} ${responseStylePrefix}

**Meeting Planner Activated**

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
• Pie charts for proportions
• Scatter plots for correlations

Would you like me to help analyze specific data?`;
        
      case 'Creative':
        return `${personalityPrefix} ${responseStylePrefix}

**Creative Brain Activated**

🎨 **Creative Challenge**: ${input}

Here are some innovative ideas:

**Brainstorming Results**:
1. **Concept A**: Revolutionary approach focusing on user experience
2. **Concept B**: Technology-driven solution with AI integration
3. **Concept C**: Community-based model with collaborative features

**Next Steps**:
• Prototype the most promising concept
• Gather feedback from potential users
• Refine and iterate on the design

Which concept interests you most?`;
        
      case 'LongTask':
        return `${personalityPrefix} ${responseStylePrefix}

**Long Task Processor Activated**

I'm ready to help with your long-running task: "${input}"

Please click the "Start Task" button to begin processing. I'll work on this independently and provide progress updates.`;
        
      default:
        // Use real API for general template
        if (apiKey) {
          try {
            const prompt = `You are ${aiName}, an AI assistant with ${personality} personality and ${responseStyle} response style.
            
User request: ${input}
Template context: ${selectedTemplate}
Custom prompt: ${customPrompt}

Please provide a helpful, intelligent response that directly addresses the user's request.`;
            
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
          }
        }
        
        // Simulated response as fallback
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
                  />
                  <p className="setting-description">
                    Required for intelligent responses. Get a free key from Google AI Studio.
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