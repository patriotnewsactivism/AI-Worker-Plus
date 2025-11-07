import { useState, useEffect, useCallback } from 'react';

const BUILT_IN_THEMES = {
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
      darkBg: '#0F172A',
      darkCard: 'rgba(30, 41, 59, 0.6)',
      darkBorder: 'rgba(56, 64, 82, 0.7)',
      textPrimary: '#F1F5F9',
      textSecondary: '#E2E8F0',
      textMuted: '#CBD5E1',
      textContrast: '#FFFFFF',
      textWarning: '#FDE68A',
      accentGradient: 'linear-gradient(135deg, #8B5CF6, #0EA5E9)',
      accentGradientAlt: 'linear-gradient(135deg, #EC4899, #F59E0B)',
      glassBg: 'rgba(30, 41, 59, 0.6)',
      glassBorder: 'rgba(56, 64, 82, 0.7)',
      glassBackdrop: 'blur(12px)'
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#7C3AED',
      primaryDark: '#5B21B6',
      secondary: '#0284C7',
      success: '#059669',
      warning: '#D97706',
      danger: '#DC2626',
      accent: '#DB2777',
      darkBg: '#F8FAFC',
      darkCard: 'rgba(255, 255, 255, 0.85)',
      darkBorder: 'rgba(148, 163, 184, 0.45)',
      textPrimary: '#1E293B',
      textSecondary: '#475569',
      textMuted: '#64748B',
      textContrast: '#0F172A',
      textWarning: '#B45309',
      accentGradient: 'linear-gradient(135deg, #7C3AED, #0284C7)',
      accentGradientAlt: 'linear-gradient(135deg, #DB2777, #D97706)',
      glassBg: 'rgba(255, 255, 255, 0.7)',
      glassBorder: 'rgba(148, 163, 184, 0.45)',
      glassBackdrop: 'blur(10px)'
    }
  }
};

const DEFAULT_THEME_SETTINGS = {
  fonts: {
    primary: 'Inter',
    secondary: 'system-ui',
    mono: 'Monaco, Courier New, monospace'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
  },
  animations: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease'
  }
};

const COLOR_KEY_ALIASES = {
  darkBg: ['background'],
  darkCard: ['surface'],
  darkBorder: ['border'],
  glassBg: ['surface', 'glassBackground'],
  glassBorder: ['border'],
  textPrimary: ['text'],
  textSecondary: ['textSecondary'],
  textMuted: ['textMuted'],
  textContrast: ['textContrast'],
  textWarning: ['textWarning'],
  primaryDark: ['primaryDark']
};

const camelToKebab = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const resolveColorValue = (key, themeData = {}) => {
  const colorSources = [
    themeData.colors?.[key],
    themeData[key]
  ];

  const aliasSources = COLOR_KEY_ALIASES[key] || [];
  aliasSources.forEach(alias => {
    colorSources.push(themeData.colors?.[alias]);
    colorSources.push(themeData[alias]);
  });

  return colorSources.find(value => typeof value !== 'undefined' && value !== null);
};

const normalizeThemeDefinition = (themeData = {}) => {
  const baseTheme = BUILT_IN_THEMES.dark;
  const resolvedColors = { ...baseTheme.colors };

  Object.keys(resolvedColors).forEach(key => {
    const colorValue = resolveColorValue(key, themeData);
    if (typeof colorValue !== 'undefined') {
      resolvedColors[key] = colorValue;
    }
  });

  resolvedColors.accentGradient =
    resolveColorValue('accentGradient', themeData) ||
    `linear-gradient(135deg, ${resolvedColors.primary}, ${resolvedColors.secondary})`;

  resolvedColors.accentGradientAlt =
    resolveColorValue('accentGradientAlt', themeData) ||
    `linear-gradient(135deg, ${resolvedColors.accent}, ${resolvedColors.warning})`;

  const normalizeSection = (sectionKey) => ({
    ...DEFAULT_THEME_SETTINGS[sectionKey],
    ...(themeData[sectionKey] || {})
  });

  return {
    id: themeData.id || Date.now(),
    name: themeData.name || 'Custom Theme',
    colors: resolvedColors,
    fonts: normalizeSection('fonts'),
    spacing: normalizeSection('spacing'),
    borderRadius: normalizeSection('borderRadius'),
    shadows: normalizeSection('shadows'),
    animations: normalizeSection('animations')
  };
};

const themeToCssVariables = (themeDefinition, activeMode = 'dark') => {
  const baseTheme = BUILT_IN_THEMES[activeMode] || BUILT_IN_THEMES.dark;
  const colors = {
    ...BUILT_IN_THEMES.dark.colors,
    ...baseTheme.colors,
    ...(themeDefinition?.colors || {})
  };

  const cssVariables = {};

  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--${camelToKebab(key)}`;
    cssVariables[cssVarName] = value;
  });

  return cssVariables;
};

const applyCssVariables = (cssVarMap) => {
  const root = document.documentElement;
  Object.entries(cssVarMap).forEach(([cssVar, value]) => {
    root.style.setProperty(cssVar, value);
  });
};

const applyThemeMetaVariables = (themeDefinition = {}) => {
  const root = document.documentElement;

  const fonts = {
    ...DEFAULT_THEME_SETTINGS.fonts,
    ...(themeDefinition.fonts || {})
  };
  Object.entries(fonts).forEach(([key, value]) => {
    root.style.setProperty(`--font-${key}`, value);
  });

  const spacing = {
    ...DEFAULT_THEME_SETTINGS.spacing,
    ...(themeDefinition.spacing || {})
  };
  Object.entries(spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });

  const borderRadius = {
    ...DEFAULT_THEME_SETTINGS.borderRadius,
    ...(themeDefinition.borderRadius || {})
  };
  Object.entries(borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--border-radius-${key}`, value);
  });

  const shadows = {
    ...DEFAULT_THEME_SETTINGS.shadows,
    ...(themeDefinition.shadows || {})
  };
  Object.entries(shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });

  const animations = {
    ...DEFAULT_THEME_SETTINGS.animations,
    ...(themeDefinition.animations || {})
  };
  Object.entries(animations).forEach(([key, value]) => {
    root.style.setProperty(`--animation-${key}`, value);
  });
};

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
        const parsedTheme = JSON.parse(savedCustomTheme);
        setCustomTheme(normalizeThemeDefinition(parsedTheme));
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
    } else {
      localStorage.removeItem('aiWorkerCustomTheme');
    }
  }, [customTheme]);

  // Apply theme variables whenever theme changes
  useEffect(() => {
    const activeTheme = customTheme || BUILT_IN_THEMES[theme] || BUILT_IN_THEMES.dark;
    const cssVarMap = themeToCssVariables(activeTheme, theme);
    applyCssVariables(cssVarMap);
    applyThemeMetaVariables(activeTheme);
  }, [theme, customTheme]);

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
    const customThemeData = normalizeThemeDefinition({
      ...themeData,
      colors: {
        ...(themeData?.colors || {}),
        primary: themeData.primary,
        primaryDark: themeData.primaryDark,
        secondary: themeData.secondary,
        accent: themeData.accent,
        success: themeData.success,
        warning: themeData.warning,
        danger: themeData.danger,
        darkBg: themeData.darkBg,
        darkCard: themeData.darkCard,
        darkBorder: themeData.darkBorder,
        textPrimary: themeData.textPrimary,
        textSecondary: themeData.textSecondary,
        textMuted: themeData.textMuted,
        textContrast: themeData.textContrast,
        textWarning: themeData.textWarning,
        glassBg: themeData.glassBg,
        glassBorder: themeData.glassBorder,
        glassBackdrop: themeData.glassBackdrop
      }
    });

    setCustomTheme(customThemeData);
    return customThemeData;
  }, []);

  // Apply custom theme
  const applyCustomTheme = useCallback((themeData) => {
    if (!themeData) return;

    const normalizedTheme = normalizeThemeDefinition(themeData);

    if (!customTheme || customTheme.id !== normalizedTheme.id) {
      setCustomTheme(normalizedTheme);
    }

    const cssVarMap = themeToCssVariables(normalizedTheme, theme);
    applyCssVariables(cssVarMap);
    applyThemeMetaVariables(normalizedTheme);
  }, [theme, customTheme]);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    setCustomTheme(null);
  }, []);

  // Get current theme data
  const getCurrentTheme = useCallback(() => {
    if (customTheme) {
      return customTheme;
    }

    return BUILT_IN_THEMES[theme] || BUILT_IN_THEMES.dark;
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