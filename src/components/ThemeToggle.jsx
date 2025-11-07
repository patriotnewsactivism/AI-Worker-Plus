import React, { memo, useState } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';

const ThemeToggle = memo(({ 
  theme, 
  toggleTheme, 
  setThemeMode, 
  customTheme, 
  createCustomTheme, 
  applyCustomTheme, 
  resetTheme 
}) => {
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const [customThemeData, setCustomThemeData] = useState({
    name: '',
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    secondary: '#0EA5E9',
    accent: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    darkBg: '#0F172A',
    darkCard: 'rgba(30, 41, 59, 0.6)',
    darkBorder: 'rgba(56, 64, 82, 0.7)',
    glassBg: 'rgba(30, 41, 59, 0.6)',
    glassBorder: 'rgba(56, 64, 82, 0.7)',
    glassBackdrop: 'blur(12px)',
    textPrimary: '#F1F5F9',
    textSecondary: '#E2E8F0',
    textMuted: '#CBD5E1',
    textContrast: '#FFFFFF',
    textWarning: '#FDE68A'
  });

  const handleCustomThemeSubmit = (e) => {
    e.preventDefault();
    const themeData = createCustomTheme(customThemeData);
    applyCustomTheme(themeData);
    setShowCustomTheme(false);
  };

  return (
    <div className="theme-toggle">
      <div className="theme-buttons">
        <button
          className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
          onClick={() => setThemeMode('light')}
          title="Light theme"
        >
          <Sun size={16} />
        </button>
        
        <button
          className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setThemeMode('dark')}
          title="Dark theme"
        >
          <Moon size={16} />
        </button>
        
        <button
          className="theme-btn"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <button
          className="theme-btn"
          onClick={() => setShowCustomTheme(!showCustomTheme)}
          title="Custom theme"
        >
          <Palette size={16} />
        </button>
      </div>

      {showCustomTheme && (
        <div className="custom-theme-panel">
          <h4>Custom Theme</h4>
          <form onSubmit={handleCustomThemeSubmit}>
            <div className="theme-input-group">
              <label>Theme Name</label>
              <input
                type="text"
                value={customThemeData.name}
                onChange={(e) => setCustomThemeData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Custom Theme"
              />
            </div>
            
            <div className="theme-colors">
              <div className="theme-input-group">
                <label>Primary Color</label>
                <input
                  type="color"
                  value={customThemeData.primary}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, primary: e.target.value }))}
                />
              </div>
              
              <div className="theme-input-group">
                <label>Secondary Color</label>
                <input
                  type="color"
                  value={customThemeData.secondary}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, secondary: e.target.value }))}
                />
              </div>
              
              <div className="theme-input-group">
                <label>Background</label>
                <input
                  type="color"
                  value={customThemeData.darkBg}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, darkBg: e.target.value }))}
                />
              </div>

              <div className="theme-input-group">
                <label>Glass Surface</label>
                <input
                  type="color"
                  value={customThemeData.glassBg}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, glassBg: e.target.value }))}
                />
              </div>

              <div className="theme-input-group">
                <label>Text Color</label>
                <input
                  type="color"
                  value={customThemeData.textPrimary}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, textPrimary: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="theme-actions">
              <button type="submit" className="apply-theme-btn">
                Apply Theme
              </button>
              <button 
                type="button" 
                className="reset-theme-btn"
                onClick={() => {
                  resetTheme();
                  setShowCustomTheme(false);
                }}
              >
                Reset to Default
              </button>
            </div>
          </form>
        </div>
      )}

      {customTheme && (
        <div className="current-custom-theme">
          <span>Custom: {customTheme.name}</span>
          <button 
            className="remove-custom-btn"
            onClick={resetTheme}
            title="Remove custom theme"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});

ThemeToggle.displayName = 'ThemeToggle';

export default ThemeToggle;