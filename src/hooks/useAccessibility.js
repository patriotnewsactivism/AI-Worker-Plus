import { useState, useEffect, useCallback } from 'react';

// Accessibility hook for screen reader support and accessibility features
export const useAccessibility = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [announcements, setAnnouncements] = useState([]);

  // Check for user preferences
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(highContrastQuery.matches);

    // Load saved preferences
    const savedFontSize = localStorage.getItem('aiWorkerFontSize');
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }

    const savedHighContrast = localStorage.getItem('aiWorkerHighContrast');
    if (savedHighContrast) {
      setIsHighContrast(JSON.parse(savedHighContrast));
    }

    // Listen for changes
    const handleMotionChange = (e) => setIsReducedMotion(e.matches);
    const handleContrastChange = (e) => setIsHighContrast(e.matches);

    mediaQuery.addEventListener('change', handleMotionChange);
    highContrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      highContrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('aiWorkerFontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('aiWorkerHighContrast', JSON.stringify(isHighContrast));
  }, [isHighContrast]);

  // Announce message to screen readers
  const announce = useCallback((message, priority = 'polite') => {
    const announcement = {
      id: Date.now(),
      message,
      priority,
      timestamp: new Date()
    };

    setAnnouncements(prev => [...prev, announcement]);

    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    }, 5000);

    // Also use aria-live region
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, []);

  // Toggle high contrast mode
  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => !prev);
    announce('High contrast mode ' + (isHighContrast ? 'disabled' : 'enabled'));
  }, [isHighContrast, announce]);

  // Set font size
  const setFontSizeMode = useCallback((size) => {
    setFontSize(size);
    announce(`Font size set to ${size}`);
  }, [announce]);

  // Focus management
  const focusElement = useCallback((elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      announce(`Focused on ${element.getAttribute('aria-label') || element.textContent || 'element'}`);
    }
  }, [announce]);

  // Skip to main content
  const skipToMain = useCallback(() => {
    focusElement('main-content');
  }, [focusElement]);

  // Skip to sidebar
  const skipToSidebar = useCallback(() => {
    focusElement('sidebar');
  }, [focusElement]);

  // Skip to chat
  const skipToChat = useCallback(() => {
    focusElement('chat-input');
  }, [focusElement]);

  // Get accessibility attributes for elements
  const getAccessibilityProps = useCallback((options = {}) => {
    const {
      role,
      label,
      description,
      expanded,
      selected,
      disabled,
      required,
      invalid,
      live
    } = options;

    const props = {};

    if (role) props.role = role;
    if (label) props['aria-label'] = label;
    if (description) props['aria-describedby'] = description;
    if (expanded !== undefined) props['aria-expanded'] = expanded;
    if (selected !== undefined) props['aria-selected'] = selected;
    if (disabled !== undefined) props['aria-disabled'] = disabled;
    if (required !== undefined) props['aria-required'] = required;
    if (invalid !== undefined) props['aria-invalid'] = invalid;
    if (live) props['aria-live'] = live;

    return props;
  }, []);

  // Create accessible button props
  const getButtonProps = useCallback((label, options = {}) => {
    return {
      ...getAccessibilityProps({
        role: 'button',
        label,
        ...options
      }),
      tabIndex: 0,
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          options.onClick?.(e);
        }
      }
    };
  }, [getAccessibilityProps]);

  // Create accessible input props
  const getInputProps = useCallback((label, options = {}) => {
    return {
      ...getAccessibilityProps({
        role: 'textbox',
        label,
        required: options.required,
        invalid: options.invalid,
        ...options
      }),
      'aria-autocomplete': options.autocomplete || 'none'
    };
  }, [getAccessibilityProps]);

  // Create accessible list props
  const getListProps = useCallback((label, options = {}) => {
    return {
      ...getAccessibilityProps({
        role: 'list',
        label,
        ...options
      })
    };
  }, [getAccessibilityProps]);

  // Create accessible list item props
  const getListItemProps = useCallback((label, options = {}) => {
    return {
      ...getAccessibilityProps({
        role: 'listitem',
        label,
        ...options
      })
    };
  }, [getAccessibilityProps]);

  // Apply accessibility styles
  const getAccessibilityStyles = useCallback(() => {
    const styles = {};

    // Font size
    const fontSizes = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      xlarge: '1.25rem'
    };
    styles.fontSize = fontSizes[fontSize] || fontSizes.medium;

    // High contrast
    if (isHighContrast) {
      styles.filter = 'contrast(1.5) brightness(1.2)';
    }

    // Reduced motion
    if (isReducedMotion) {
      styles.animation = 'none';
      styles.transition = 'none';
    }

    return styles;
  }, [fontSize, isHighContrast, isReducedMotion]);

  return {
    // State
    isHighContrast,
    isReducedMotion,
    fontSize,
    announcements,

    // Actions
    announce,
    toggleHighContrast,
    setFontSizeMode,
    focusElement,
    skipToMain,
    skipToSidebar,
    skipToChat,

    // Props generators
    getAccessibilityProps,
    getButtonProps,
    getInputProps,
    getListProps,
    getListItemProps,
    getAccessibilityStyles
  };
};