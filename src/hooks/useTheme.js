import { useState, useEffect, useCallback } from 'react';

// Theme hook for dark/light mode and custom themes
export const useTheme = () => {
  const [theme, setTheme] = useState('dark');
  const [customTheme, setCustomTheme] = useState(null);

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('aiWorkerTheme');
    const savedCustomTheme = localStorage.getItem('aiWorkerCustomTheme');
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    if (savedCustomTheme) {
      try {
        setCustomTheme(JSON.parse(savedCustomTheme));
      } catch (error) {
        console.error('Error loading custom theme:', error);
      }
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('aiWorkerTheme', theme);
  }, [theme]);

  // Save custom theme to localStorage
  useEffect(() => {
    if (customTheme) {
      localStorage.setItem('aiWorkerCustomTheme', JSON.stringify(customTheme));
    }
  }, [customTheme]);

  // Toggle between dark and light theme
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Set specific theme
  const setThemeMode = useCallback((newTheme) => {
    setTheme(newTheme);
  }, []);

  // Create custom theme
  const createCustomTheme = useCallback((themeData) => {
    const customThemeData = {
      id: Date.now(),
      name: themeData.name || 'Custom Theme',
      colors: {
        primary: themeData.primary || '#8B5CF6',
        secondary: themeData.secondary || '#0EA5E9',
        success: themeData.success || '#10B981',
        warning: themeData.warning || '#F59E0B',
        danger: themeData.danger || '#EF4444',
        accent: themeData.accent || '#EC4899',
        background: themeData.background || '#0F172A',
        surface: themeData.surface || '#1E293B',
        text: themeData.text || '#F1F5F9',
        textSecondary: themeData.textSecondary || '#E2E8F0',
        textMuted: themeData.textMuted || '#CBD5E1',
        border: themeData.border || 'rgba(56, 64, 82, 0.7)',
        ...themeData.colors
      },
      fonts: {
        primary: themeData.fontPrimary || 'Inter',
        secondary: themeData.fontSecondary || 'system-ui',
        mono: themeData.fontMono || 'Monaco, Courier New, monospace',
        ...themeData.fonts
      },
      spacing: {
        xs: themeData.spacingXs || '0.25rem',
        sm: themeData.spacingSm || '0.5rem',
        md: themeData.spacingMd || '1rem',
        lg: themeData.spacingLg || '1.5rem',
        xl: themeData.spacingXl || '2rem',
        ...themeData.spacing
      },
      borderRadius: {
        sm: themeData.borderRadiusSm || '4px',
        md: themeData.borderRadiusMd || '8px',
        lg: themeData.borderRadiusLg || '12px',
        xl: themeData.borderRadiusXl || '16px',
        ...themeData.borderRadius
      },
      shadows: {
        sm: themeData.shadowSm || '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: themeData.shadowMd || '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: themeData.shadowLg || '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: themeData.shadowXl || '0 20px 25px rgba(0, 0, 0, 0.1)',
        ...themeData.shadows
      },
      animations: {
        fast: themeData.animationFast || '0.15s ease',
        normal: themeData.animationNormal || '0.3s ease',
        slow: themeData.animationSlow || '0.5s ease',
        ...themeData.animations
      }
    };

    setCustomTheme(customThemeData);
    return customThemeData;
  }, []);

  // Apply custom theme
  const applyCustomTheme = useCallback((themeData) => {
    if (!themeData) return;

    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(themeData.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply font variables
    Object.entries(themeData.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // Apply spacing variables
    Object.entries(themeData.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply border radius variables
    Object.entries(themeData.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Apply shadow variables
    Object.entries(themeData.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Apply animation variables
    Object.entries(themeData.animations).forEach(([key, value]) => {
      root.style.setProperty(`--animation-${key}`, value);
    });
  }, []);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    setCustomTheme(null);
    const root = document.documentElement;
    
    // Remove custom theme variables
    const customVars = [
      '--font-primary', '--font-secondary', '--font-mono',
      '--spacing-xs', '--spacing-sm', '--spacing-md', '--spacing-lg', '--spacing-xl',
      '--border-radius-sm', '--border-radius-md', '--border-radius-lg', '--border-radius-xl',
      '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl',
      '--animation-fast', '--animation-normal', '--animation-slow'
    ];
    
    customVars.forEach(varName => {
      root.style.removeProperty(varName);
    });
  }, []);

  // Get current theme data
  const getCurrentTheme = useCallback(() => {
    if (customTheme) {
      return customTheme;
    }

    // Default themes
    const themes = {
      dark: {
        name: 'Dark',
        colors: {
          primary: '#8B5CF6',
          secondary: '#0EA5E9',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          accent: '#EC4899',
          background: '#0F172A',
          surface: '#1E293B',
          text: '#F1F5F9',
          textSecondary: '#E2E8F0',
          textMuted: '#CBD5E1',
          border: 'rgba(56, 64, 82, 0.7)'
        }
      },
      light: {
        name: 'Light',
        colors: {
          primary: '#7C3AED',
          secondary: '#0284C7',
          success: '#059669',
          warning: '#D97706',
          danger: '#DC2626',
          accent: '#DB2777',
          background: '#FFFFFF',
          surface: '#F8FAFC',
          text: '#1E293B',
          textSecondary: '#475569',
          textMuted: '#64748B',
          border: 'rgba(148, 163, 184, 0.3)'
        }
      }
    };

    return themes[theme] || themes.dark;
  }, [theme, customTheme]);

  return {
    theme,
    customTheme,
    toggleTheme,
    setThemeMode,
    createCustomTheme,
    applyCustomTheme,
    resetTheme,
    getCurrentTheme
  };
};