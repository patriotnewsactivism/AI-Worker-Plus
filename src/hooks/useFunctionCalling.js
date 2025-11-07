import { useState, useCallback } from 'react';

// Function calling hook for AI to execute specific functions
export const useFunctionCalling = () => {
  const [availableFunctions, setAvailableFunctions] = useState({});
  const [functionResults, setFunctionResults] = useState([]);

  // Register a function that AI can call
  const registerFunction = useCallback((name, description, parameters, handler) => {
    setAvailableFunctions(prev => ({
      ...prev,
      [name]: {
        description,
        parameters,
        handler
      }
    }));
  }, []);

  // Unregister a function
  const unregisterFunction = useCallback((name) => {
    setAvailableFunctions(prev => {
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Execute a function
  const executeFunction = useCallback(async (functionName, args) => {
    const func = availableFunctions[functionName];
    if (!func) {
      throw new Error(`Function ${functionName} not found`);
    }

    try {
      const result = await func.handler(args);
      const functionResult = {
        id: Date.now(),
        functionName,
        args,
        result,
        timestamp: new Date().toISOString(),
        success: true
      };
      
      setFunctionResults(prev => [...prev, functionResult]);
      return result;
    } catch (error) {
      const functionResult = {
        id: Date.now(),
        functionName,
        args,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };
      
      setFunctionResults(prev => [...prev, functionResult]);
      throw error;
    }
  }, [availableFunctions]);

  // Get function definitions for AI
  const getFunctionDefinitions = useCallback(() => {
    return Object.entries(availableFunctions).map(([name, func]) => ({
      name,
      description: func.description,
      parameters: func.parameters
    }));
  }, [availableFunctions]);

  // Clear function results
  const clearResults = useCallback(() => {
    setFunctionResults([]);
  }, []);

  // Get recent function results
  const getRecentResults = useCallback((limit = 10) => {
    return functionResults.slice(-limit);
  }, [functionResults]);

  return {
    availableFunctions,
    functionResults,
    registerFunction,
    unregisterFunction,
    executeFunction,
    getFunctionDefinitions,
    clearResults,
    getRecentResults
  };
};