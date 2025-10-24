import React, { useState, useEffect } from 'react';

// Agent types
const AGENT_TYPES = {
  RESEARCHER: 'researcher',
  DEVELOPER: 'developer',
  ANALYST: 'analyst',
  CREATIVE: 'creative',
  PLANNER: 'planner',
  SPECIALIST: 'specialist',
  COORDINATOR: 'coordinator'
};

// Agent class
class AIWorkerAgent {
  constructor(type, name, capabilities, apiKey) {
    this.type = type;
    this.name = name;
    this.capabilities = capabilities;
    this.apiKey = apiKey;
    this.isActive = false;
    this.lastActive = null;
    this.tasksCompleted = 0;
  }

  // Generate specialized prompt based on agent type
  generatePrompt(task, context) {
    const basePrompt = `You are ${this.name}, an AI specialist agent of type ${this.type}.`;
    
    switch (this.type) {
      case AGENT_TYPES.RESEARCHER:
        return `${basePrompt} Your expertise is in researching and gathering information.
        
        Task: ${task}
        Context: ${context}
        
        Provide detailed research findings with sources and references.`;
      
      case AGENT_TYPES.DEVELOPER:
        return `${basePrompt} Your expertise is in software development and coding.
        
        Task: ${task}
        Context: ${context}
        
        Provide code solutions, explanations, and best practices.`;
      
      case AGENT_TYPES.ANALYST:
        return `${basePrompt} Your expertise is in data analysis and insights.
        
        Task: ${task}
        Context: ${context}
        
        Provide data-driven insights and analytical conclusions.`;
      
      case AGENT_TYPES.CREATIVE:
        return `${basePrompt} Your expertise is in creative ideation and brainstorming.
        
        Task: ${task}
        Context: ${context}
        
        Provide innovative ideas and creative solutions.`;
      
      case AGENT_TYPES.PLANNER:
        return `${basePrompt} Your expertise is in project planning and organization.
        
        Task: ${task}
        Context: ${context}
        
        Provide structured plans and actionable steps.`;
      
      case AGENT_TYPES.SPECIALIST:
        return `${basePrompt} Your expertise is in specialized domain knowledge.
        
        Task: ${task}
        Context: ${context}
        
        Provide expert-level specialized knowledge and solutions.`;
      
      case AGENT_TYPES.COORDINATOR:
        return `${basePrompt} Your role is to coordinate between different agents and synthesize their outputs.
        
        Task: ${task}
        Context: ${context}
        
        Coordinate the efforts of other agents and provide a unified response.`;
      
      default:
        return `${basePrompt}
        
        Task: ${task}
        Context: ${context}`;
    }
  }

  // Process task with this agent
  async processTask(task, context) {
    if (!this.apiKey) {
      throw new Error('API key is required for agent processing');
    }

    this.isActive = true;
    this.lastActive = new Date();

    try {
      const prompt = this.generatePrompt(task, context);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
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
            maxOutputTokens: 1000,
            topK: 1,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Agent ${this.name} failed with status ${response.status}`);
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
      
      this.tasksCompleted += 1;
      this.isActive = false;
      
      return {
        agent: this.name,
        type: this.type,
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.isActive = false;
      throw error;
    }
  }
}

// Agent Manager hook
export const useAgentManager = (apiKey) => {
  const [agents, setAgents] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize default agents
  useEffect(() => {
    if (apiKey) {
      const defaultAgents = [
        new AIWorkerAgent(AGENT_TYPES.COORDINATOR, 'Coordinator', ['task coordination', 'result synthesis'], apiKey),
        new AIWorkerAgent(AGENT_TYPES.RESEARCHER, 'Researcher', ['information gathering', 'source verification'], apiKey),
        new AIWorkerAgent(AGENT_TYPES.DEVELOPER, 'Developer', ['coding', 'software solutions'], apiKey),
        new AIWorkerAgent(AGENT_TYPES.ANALYST, 'Analyst', ['data processing', 'insights generation'], apiKey),
        new AIWorkerAgent(AGENT_TYPES.CREATIVE, 'Creative', ['ideation', 'brainstorming'], apiKey),
        new AIWorkerAgent(AGENT_TYPES.PLANNER, 'Planner', ['organization', 'scheduling'], apiKey),
        new AIWorkerAgent(AGENT_TYPES.SPECIALIST, 'Specialist', ['domain expertise', 'advanced solutions'], apiKey)
      ];
      
      setAgents(defaultAgents);
    }
  }, [apiKey]);

  // Add a new agent
  const addAgent = (type, name, capabilities) => {
    const newAgent = new AIWorkerAgent(type, name, capabilities, apiKey);
    setAgents(prev => [...prev, newAgent]);
  };

  // Remove an agent
  const removeAgent = (agentName) => {
    setAgents(prev => prev.filter(agent => agent.name !== agentName));
    setActiveAgents(prev => prev.filter(name => name !== agentName));
  };

  // Toggle agent activation
  const toggleAgent = (agentName) => {
    setActiveAgents(prev => {
      if (prev.includes(agentName)) {
        return prev.filter(name => name !== agentName);
      } else {
        return [...prev, agentName];
      }
    });
  };

  // Process task with multiple agents
  const processTaskWithAgents = async (task, context) => {
    if (activeAgents.length === 0) {
      throw new Error('No active agents selected');
    }

    setIsProcessing(true);
    
    try {
      // Get active agents
      const agentsToUse = agents.filter(agent => activeAgents.includes(agent.name));
      
      // Process task with all active agents in parallel
      const agentPromises = agentsToUse.map(agent => 
        agent.processTask(task, context).catch(error => ({
          agent: agent.name,
          type: agent.type,
          result: `Error: ${error.message}`,
          timestamp: new Date().toISOString()
        }))
      );
      
      // Wait for all agents to complete
      const results = await Promise.all(agentPromises);
      
      return results;
    } finally {
      setIsProcessing(false);
    }
  };

  // Get agent by name
  const getAgent = (name) => {
    return agents.find(agent => agent.name === name);
  };

  // Get agent statistics
  const getAgentStats = () => {
    return agents.map(agent => ({
      name: agent.name,
      type: agent.type,
      isActive: agent.isActive,
      tasksCompleted: agent.tasksCompleted,
      lastActive: agent.lastActive
    }));
  };

  return {
    agents,
    activeAgents,
    isProcessing,
    addAgent,
    removeAgent,
    toggleAgent,
    processTaskWithAgents,
    getAgent,
    getAgentStats
  };
};

export { AGENT_TYPES, AIWorkerAgent };