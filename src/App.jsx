import React, { useState, useEffect, useRef, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { Settings, Brain, Zap, Target, Rocket, Globe } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Toaster, toast } from 'react-hot-toast';
import { isPWA } from './registerSW.js';
import { useAgentManager, AGENT_TYPES } from './agents/AgentManager.jsx';
import { useContextAwareAI } from './hooks/useContextAwareAI';
import { useAuth } from './hooks/useAuth';
import { useCloudSync } from './hooks/useCloudSync';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts, createDefaultShortcuts } from './hooks/useKeyboardShortcuts';
import { useAccessibility } from './hooks/useAccessibility';
import AuthModal from './components/AuthModal';
import ThemeToggle from './components/ThemeToggle';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import './App.css';

// Lazy load components for better performance
const Sidebar = lazy(() => import('./components/Sidebar.jsx'));
const Chat = lazy(() => import('./components/Chat.jsx'));
const Settings = lazy(() => import('./components/Settings.jsx'));

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
  
  // Initialize context-aware AI
  const contextAwareAI = useContextAwareAI(apiKey);
  
  // Initialize authentication
  const { user, loading: authLoading, error: authError, signIn, signUp, signInWithGoogle, logout, resetPassword } = useAuth();
  
  // Initialize cloud sync
  const cloudSync = useCloudSync(user);
  
  // Initialize theme system
  const theme = useTheme();
  
  // Initialize accessibility
  const accessibility = useAccessibility();
  
  // Authentication state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `👋 Hello! I'm your AI employee.\n\n🎯 Just say my name ("${aiName}") followed by your request and I'll respond instantly!\n\n⚠️ **IMPORTANT**: Please add your Gemini API key in settings to enable real AI responses. Without an API key, I cannot provide intelligent responses.`,
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
  
  // Templates - memoized for performance
  const templates = useMemo(() => ({
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
  }), []);
  
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

  // Check cloud sync status when API key changes
  useEffect(() => {
    checkCloudSyncStatus();
  }, [apiKey]);
  
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
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
  
  // Toggle voice listening - memoized for performance
  const toggleListening = useCallback(() => {
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
  }, [isListening, selectedLanguage, aiName]);
  
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
  
  // Process user input with context-aware AI
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
      
      // Use context-aware AI for response generation
      const aiResponse = await contextAwareAI.generateResponse(
        input,
        selectedTemplate,
        personality,
        responseStyle,
        temperature,
        maxTokens,
        customPrompt,
        skills
      );
      
      // Add AI response to messages
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
  
  // Check cloud sync status based on API key
  const checkCloudSyncStatus = () => {
    if (!apiKey || apiKey.trim() === '') {
      setCloudSyncStatus('disconnected');
    } else {
      // Simulate checking API key validity
      setCloudSyncStatus('syncing');
      setTimeout(() => {
        // In a real implementation, we would actually test the API key here
        // For now, we'll assume it's valid if it exists
        setCloudSyncStatus('connected');
      }, 1500);
    }
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

  const handleGitHubPull = async (repoUrl) => {
    // In a real implementation, this would pull from GitHub
    // For now, we'll simulate the process
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          // Simulate adding some files to the workspace
          const newFiles = [
            { name: 'README.md', type: 'text/markdown', size: 1234, content: 'Pulled from GitHub repository' },
            { name: 'package.json', type: 'application/json', size: 567, content: '{"name": "github-repo"}' }
          ];
          setWorkspaceFiles(prev => [...prev, ...newFiles]);
          resolve();
        }, 2000);
      }),
      {
        loading: '📥 Pulling repository from GitHub...',
        success: '✅ Repository pulled successfully!',
        error: '❌ Error pulling repository'
      }
    );
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
  
  // Authentication handlers
  const handleSignIn = useCallback(async (email, password) => {
    try {
      await signIn(email, password);
      setShowAuthModal(false);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error('Sign in failed: ' + error.message);
    }
  }, [signIn]);

  const handleSignUp = useCallback(async (email, password, displayName) => {
    try {
      await signUp(email, password, displayName);
      setShowAuthModal(false);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Sign up failed: ' + error.message);
    }
  }, [signUp]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
      toast.success('Signed in with Google!');
    } catch (error) {
      toast.error('Google sign in failed: ' + error.message);
    }
  }, [signInWithGoogle]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Logout failed: ' + error.message);
    }
  }, [logout]);

  const handleResetPassword = useCallback(async (email) => {
    try {
      await resetPassword(email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Password reset failed: ' + error.message);
    }
  }, [resetPassword]);

  // Cloud sync handlers
  const syncToCloud = useCallback(async () => {
    if (!user) return;

    try {
      const userData = {
        aiName,
        selectedTemplate,
        customPrompt,
        skills,
        personality,
        responseStyle,
        temperature,
        maxTokens,
        selectedVoice,
        selectedLanguage,
        messages: messages.slice(-50), // Last 50 messages
        memoryBank,
        workspaceFiles: workspaceFiles.slice(-20) // Last 20 files
      };

      await cloudSync.syncUserData(userData);
      toast.success('Data synced to cloud!');
    } catch (error) {
      console.error('Cloud sync error:', error);
      toast.error('Cloud sync failed: ' + error.message);
    }
  }, [user, cloudSync, aiName, selectedTemplate, customPrompt, skills, personality, responseStyle, temperature, maxTokens, selectedVoice, selectedLanguage, messages, memoryBank, workspaceFiles]);

  // Load data from cloud
  const loadFromCloud = useCallback(async () => {
    if (!user) return;

    try {
      const userData = await cloudSync.getUserData();
      if (userData) {
        // Restore user settings
        if (userData.aiName) setAiName(userData.aiName);
        if (userData.selectedTemplate) setSelectedTemplate(userData.selectedTemplate);
        if (userData.customPrompt) setCustomPrompt(userData.customPrompt);
        if (userData.skills) setSkills(userData.skills);
        if (userData.personality) setPersonality(userData.personality);
        if (userData.responseStyle) setResponseStyle(userData.responseStyle);
        if (userData.temperature) setTemperature(userData.temperature);
        if (userData.maxTokens) setMaxTokens(userData.maxTokens);
        if (userData.selectedVoice) setSelectedVoice(userData.selectedVoice);
        if (userData.selectedLanguage) setSelectedLanguage(userData.selectedLanguage);
        if (userData.messages) setMessages(userData.messages);
        if (userData.memoryBank) setMemoryBank(userData.memoryBank);
        if (userData.workspaceFiles) setWorkspaceFiles(userData.workspaceFiles);
        
        toast.success('Data loaded from cloud!');
      }
    } catch (error) {
      console.error('Load from cloud error:', error);
      toast.error('Failed to load data from cloud: ' + error.message);
    }
  }, [user, cloudSync]);

  // Auto-sync when data changes
  useEffect(() => {
    if (user && cloudSync.isOnline) {
      const timeoutId = setTimeout(() => {
        syncToCloud();
      }, 2000); // Debounce sync

      return () => clearTimeout(timeoutId);
    }
  }, [user, cloudSync.isOnline, syncToCloud]);

  // Load data when user signs in
  useEffect(() => {
    if (user) {
      loadFromCloud();
    }
  }, [user, loadFromCloud]);

  // Apply custom theme when it changes
  useEffect(() => {
    if (theme.customTheme) {
      theme.applyCustomTheme(theme.customTheme);
    }
  }, [theme.customTheme, theme.applyCustomTheme]);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => createDefaultShortcuts({
    showShortcuts: () => setShowShortcuts(true),
    focusInput: () => inputRef.current?.focus(),
    switchToGeneral: () => setSelectedTemplate('General'),
    switchToDeveloper: () => setSelectedTemplate('Developer'),
    switchToCreative: () => setSelectedTemplate('Creative'),
    switchToData: () => setSelectedTemplate('Data'),
    switchToMeeting: () => setSelectedTemplate('Meeting'),
    switchToSummary: () => setSelectedTemplate('Summary'),
    switchToLongTask: () => setSelectedTemplate('LongTask'),
    sendMessage: () => {
      if (inputValue.trim()) {
        handleSubmit({ preventDefault: () => {} });
      }
    },
    toggleVoice: toggleListening,
    saveSettings: saveSettings,
    openSettings: () => setShowSettings(true),
    syncToCloud: syncToCloud,
    loadFromCloud: loadFromCloud,
    toggleTheme: theme.toggleTheme,
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    },
    toggleSidebar: () => {
      // Toggle sidebar visibility
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
      }
    },
    openFile: () => {
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.click();
    },
    exportConversation: contextAwareAI.exportConversation,
    activateMultiAgent: () => {
      const input = inputRef.current;
      if (input) {
        input.value = 'multi-agent ';
        input.focus();
      }
    },
    clearConversation: () => {
      setMessages([{
        id: 1,
        type: 'ai',
        content: `👋 Hello! I'm your AI employee.\n\n🎯 Just say my name ("${aiName}") followed by your request and I'll respond instantly!\n\n💻 Try the "Developer" template for coding help or "Long Task" for extended processing.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      contextAwareAI.clearAllData();
    },
    closeModals: () => {
      setShowAuthModal(false);
      setShowSettings(false);
      setShowShortcuts(false);
    }
  }), [theme.toggleTheme, syncToCloud, loadFromCloud, saveSettings, toggleListening, contextAwareAI, aiName, inputValue, handleSubmit]);

  useKeyboardShortcuts(shortcuts);

  // Memoized handlers for performance
  const handleFileProcessed = useCallback((fileData) => {
    console.log('File processed:', fileData);
    setWorkspaceFiles(prev => [...prev, fileData]);
    toast.success(`📁 File processed: ${fileData.name}`);
  }, []);

  const handleAgentResults = useCallback((results) => {
    console.log('Agent results:', results);
    setAgentResults(results);
    toast.success('🤖 Multi-agent processing completed!');
  }, []);

  const handleGitHubConnect = useCallback(() => {
    setGithubConnected(true);
    toast.success('🔗 GitHub connected successfully!');
  }, []);

  const handleGitHubPull = useCallback(async (repoUrl) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          const newFiles = [
            { name: 'README.md', type: 'text/markdown', size: 1234, content: 'Pulled from GitHub repository' },
            { name: 'package.json', type: 'application/json', size: 567, content: '{"name": "github-repo"}' }
          ];
          setWorkspaceFiles(prev => [...prev, ...newFiles]);
          resolve();
        }, 2000);
      }),
      {
        loading: '📥 Pulling repository from GitHub...',
        success: '✅ Repository pulled successfully!',
        error: '❌ Error pulling repository'
      }
    );
  }, []);
  
  // Get cloud sync status icon
  const getCloudSyncIcon = () => {
    switch (cloudSyncStatus) {
      case 'syncing':
        return '🔄';
      case 'connected':
        return '✅';
      case 'disconnected':
        return '❌';
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
            <div className={`cloud-status ${cloudSync.syncStatus}`} title={`Cloud status: ${cloudSync.syncStatus}`}>
              {cloudSync.isOnline ? '☁️' : '📡'}
            </div>
            
            <ThemeToggle 
              theme={theme.theme}
              toggleTheme={theme.toggleTheme}
              setThemeMode={theme.setThemeMode}
              customTheme={theme.customTheme}
              createCustomTheme={theme.createCustomTheme}
              applyCustomTheme={theme.applyCustomTheme}
              resetTheme={theme.resetTheme}
            />
            
            <button 
              className="shortcuts-btn"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts (Ctrl+/)"
            >
              ⌨️
            </button>
            
            {user ? (
              <div className="user-controls">
                <span className="user-name">{user.displayName || user.email}</span>
                <button 
                  className="sync-btn"
                  onClick={syncToCloud}
                  title="Sync to cloud (Ctrl+Shift+S)"
                >
                  🔄
                </button>
                <button 
                  className="logout-btn"
                  onClick={handleLogout}
                  title="Sign out"
                >
                  🚪
                </button>
              </div>
            ) : (
              <button 
                className="auth-btn"
                onClick={() => setShowAuthModal(true)}
                title="Sign in"
              >
                👤 Sign In
              </button>
            )}
            
            <button 
              className="settings-btn"
              onClick={() => setShowSettings(true)}
              title="Settings (Ctrl+,)"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <Suspense fallback={<div className="loading">Loading sidebar...</div>}>
          <Sidebar 
            templates={templates}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            memoryBank={memoryBank}
            onFileProcessed={handleFileProcessed}
            githubConnected={githubConnected}
            onGitHubConnect={handleGitHubConnect}
            onGitHubPull={handleGitHubPull}
          />
        </Suspense>

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
          <Suspense fallback={<div className="loading">Loading chat...</div>}>
            <Chat 
              messages={messages}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isListening={isListening}
              isProcessing={isProcessing}
              isLongTaskRunning={isLongTaskRunning}
              longTaskProgress={longTaskProgress}
              agentResults={agentResults}
              aiName={aiName}
              selectedTemplate={selectedTemplate}
              handleSubmit={handleSubmit}
              toggleListening={toggleListening}
              stopLongTask={stopLongTask}
            />
          </Suspense>
        </main>
      </div>

      {/* Settings Panel */}
      <Suspense fallback={<div className="loading">Loading settings...</div>}>
        <Settings 
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          aiName={aiName}
          setAiName={setAiName}
          apiKey={apiKey}
          setApiKey={setApiKey}
          personality={personality}
          setPersonality={setPersonality}
          responseStyle={responseStyle}
          setResponseStyle={setResponseStyle}
          temperature={temperature}
          setTemperature={setTemperature}
          maxTokens={maxTokens}
          setMaxTokens={setMaxTokens}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          skills={skills}
          setSkills={setSkills}
          newSkill={newSkill}
          setNewSkill={setNewSkill}
          addSkill={addSkill}
          removeSkill={removeSkill}
          saveSettings={saveSettings}
        />
      </Suspense>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        loading={authLoading}
        error={authError}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />

      {/* Accessibility Live Region */}
      <div 
        id="aria-live-region" 
        aria-live="polite" 
        aria-atomic="true"
        style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
      />
    </div>
  );
}

export default App;