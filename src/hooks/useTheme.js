import { useState, useEffect, useCallback } from 'react';

const DEFAULT_THEMES = {
  dark: {
    name: 'Dark',
    colors: {
      primary: '#8B5CF6',
      primaryDark: '#7C3AED',
      secondary: '#0EA5E9',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      accent: '#EC4899',
      background: '#0F172A',
      darkBg: '#0F172A',
      surface: '#1E293B',
      darkCard: 'rgba(30, 41, 59, 0.6)',
      darkBorder: 'rgba(56, 64, 82, 0.7)',
      text: '#F1F5F9',
      textPrimary: '#F1F5F9',
      textSecondary: '#E2E8F0',
      textMuted: '#CBD5E1',
      textContrast: '#FFFFFF',
      textWarning: '#FDE68A',
      border: 'rgba(56, 64, 82, 0.7)',
      glassBg: 'rgba(30, 41, 59, 0.6)',
      glassBorder: 'rgba(56, 64, 82, 0.7)',
      glassBackdrop: 'blur(12px)',
      bodyGradient: 'linear-gradient(135deg, #0F172A, #1E293B)',
      accentGradient: 'linear-gradient(135deg, #8B5CF6, #0EA5E9)',
      accentGradientAlt: 'linear-gradient(135deg, #EC4899, #F59E0B)',
      focusOutline: '0 0 0 3px rgba(139, 92, 246, 0.4)'
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#7C3AED',
      primaryDark: '#6D28D9',
      secondary: '#0284C7',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      accent: '#DB2777',
      background: '#FFFFFF',
      darkBg: '#F8FAFC',
      surface: '#F1F5F9',
      darkCard: 'rgba(255, 255, 255, 0.85)',
      darkBorder: 'rgba(148, 163, 184, 0.4)',
      text: '#1E293B',
      textPrimary: '#1E293B',
      textSecondary: '#475569',
      textMuted: '#64748B',
      textContrast: '#0F172A',
      textWarning: '#B45309',
      border: 'rgba(148, 163, 184, 0.3)',
      glassBg: 'rgba(255, 255, 255, 0.7)',
      glassBorder: 'rgba(148, 163, 184, 0.6)',
      glassBackdrop: 'blur(18px)',
      bodyGradient: 'linear-gradient(135deg, #FFFFFF, #E2E8F0)',
      accentGradient: 'linear-gradient(135deg, #7C3AED, #0284C7)',
      accentGradientAlt: 'linear-gradient(135deg, #DB2777, #D97706)',
      focusOutline: '0 0 0 3px rgba(30, 64, 175, 0.3)'
    }
  },
  highContrast: {
    name: 'High Contrast',
    colors: {
      primary: '#FFD60A',
      primaryDark: '#FFB200',
      secondary: '#00A3FF',
      success: '#00E68A',
      warning: '#FF9E00',
      danger: '#FF3B3B',
      accent: '#FF1A75',
      background: '#000000',
      darkBg: '#050505',
      surface: '#0A0A0A',
      darkCard: 'rgba(15, 15, 15, 0.95)',
      darkBorder: '#FFFFFF',
      text: '#FFFFFF',
      textPrimary: '#FFFFFF',
      textSecondary: '#F5F5F5',
      textMuted: '#CCCCCC',
      textContrast: '#000000',
      textWarning: '#FFE066',
      border: '#FFFFFF',
      glassBg: 'rgba(0, 0, 0, 0.92)',
      glassBorder: '#FFFFFF',
      glassBackdrop: 'blur(4px)',
      bodyGradient: 'linear-gradient(135deg, #000000, #050505)',
      accentGradient: 'linear-gradient(135deg, #FFD60A, #00A3FF)',
      accentGradientAlt: 'linear-gradient(135deg, #FF1A75, #FF9E00)',
      focusOutline: '0 0 0 3px #FFFFFF'
    }
  }
};

const toCssVarName = (key) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();

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

  const applyDefaultTheme = useCallback((themeKey) => {
    const root = document.documentElement;
    const themeData = DEFAULT_THEMES[themeKey] || DEFAULT_THEMES.dark;

    if (themeData?.colors) {
      Object.entries(themeData.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${toCssVarName(key)}`, value);
      });
    }

    return themeData;
  }, []);

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
    root.setAttribute('data-theme', 'custom');

    // Apply color variables
    Object.entries(themeData.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${toCssVarName(key)}`, value);
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

  useEffect(() => {
    const root = document.documentElement;

    if (customTheme) {
      root.setAttribute('data-theme', 'custom');
      applyCustomTheme(customTheme);
      return;
    }

    root.setAttribute('data-theme', theme);
    applyDefaultTheme(theme);
  }, [theme, customTheme, applyCustomTheme, applyDefaultTheme]);

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

    return DEFAULT_THEMES[theme] || DEFAULT_THEMES.dark;
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