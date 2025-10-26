import React, { memo } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';

const Settings = memo(({ 
  showSettings, 
  setShowSettings, 
  aiName, 
  setAiName, 
  apiKey, 
  setApiKey, 
  personality, 
  setPersonality, 
  responseStyle, 
  setResponseStyle, 
  temperature, 
  setTemperature, 
  maxTokens, 
  setMaxTokens, 
  selectedVoice, 
  setSelectedVoice, 
  selectedLanguage, 
  setSelectedLanguage, 
  customPrompt, 
  setCustomPrompt, 
  skills, 
  setSkills, 
  newSkill, 
  setNewSkill, 
  addSkill, 
  removeSkill, 
  saveSettings 
}) => {
  if (!showSettings) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2><SettingsIcon size={24} /> Configuration</h2>
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
                required
              />
              <p className="setting-description" style={{color: '#dc2626', fontWeight: 'bold'}}>
                ⚠️ Required for real AI responses - No simulated responses will be provided
              </p>
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
  );
});

Settings.displayName = 'Settings';

export default Settings;