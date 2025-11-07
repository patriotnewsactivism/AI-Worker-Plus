import React, { memo, useState } from 'react';
import { Sun, Moon, Palette, Settings, Contrast } from 'lucide-react';

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
    secondary: '#0EA5E9',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9'
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
          aria-pressed={theme === 'light'}
        >
          <Sun size={16} />
        </button>

        <button
          className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
          onClick={() => setThemeMode('dark')}
          title="Dark theme"
          aria-pressed={theme === 'dark'}
        >
          <Moon size={16} />
        </button>

        <button
          className={`theme-btn ${theme === 'highContrast' ? 'active' : ''}`}
          onClick={() => setThemeMode('highContrast')}
          title="High contrast theme"
          aria-pressed={theme === 'highContrast'}
        >
          <Contrast size={16} />
        </button>

        <button
          className="theme-btn"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-pressed="false"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="theme-btn"
          onClick={() => setShowCustomTheme(!showCustomTheme)}
          title="Custom theme"
          aria-expanded={showCustomTheme}
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
                  value={customThemeData.background}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, background: e.target.value }))}
                />
              </div>
              
              <div className="theme-input-group">
                <label>Surface</label>
                <input
                  type="color"
                  value={customThemeData.surface}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, surface: e.target.value }))}
                />
              </div>
              
              <div className="theme-input-group">
                <label>Text Color</label>
                <input
                  type="color"
                  value={customThemeData.text}
                  onChange={(e) => setCustomThemeData(prev => ({ ...prev, text: e.target.value }))}
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