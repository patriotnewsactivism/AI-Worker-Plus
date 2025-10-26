import { useEffect, useCallback } from 'react';

// Keyboard shortcuts hook
export const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyDown = useCallback((event) => {
    // Ignore if user is typing in an input field
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      return;
    }

    // Create shortcut key string
    const key = event.key.toLowerCase();
    const modifiers = [];
    
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    
    const shortcutKey = modifiers.length > 0 
      ? `${modifiers.join('+')}+${key}` 
      : key;

    // Find matching shortcut
    const shortcut = shortcuts.find(s => s.key === shortcutKey);
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action(event);
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common keyboard shortcuts for AI Worker Plus
export const createDefaultShortcuts = (handlers) => ({
  // Navigation shortcuts
  'ctrl+/': {
    key: 'ctrl+/',
    description: 'Show keyboard shortcuts',
    action: handlers.showShortcuts || (() => {})
  },
  'ctrl+k': {
    key: 'ctrl+k',
    description: 'Focus search/input',
    action: handlers.focusInput || (() => {})
  },
  'ctrl+1': {
    key: 'ctrl+1',
    description: 'Switch to General template',
    action: handlers.switchToGeneral || (() => {})
  },
  'ctrl+2': {
    key: 'ctrl+2',
    description: 'Switch to Developer template',
    action: handlers.switchToDeveloper || (() => {})
  },
  'ctrl+3': {
    key: 'ctrl+3',
    description: 'Switch to Creative template',
    action: handlers.switchToCreative || (() => {})
  },
  'ctrl+4': {
    key: 'ctrl+4',
    description: 'Switch to Data template',
    action: handlers.switchToData || (() => {})
  },
  'ctrl+5': {
    key: 'ctrl+5',
    description: 'Switch to Meeting template',
    action: handlers.switchToMeeting || (() => {})
  },
  'ctrl+6': {
    key: 'ctrl+6',
    description: 'Switch to Summary template',
    action: handlers.switchToSummary || (() => {})
  },
  'ctrl+7': {
    key: 'ctrl+7',
    description: 'Switch to Long Task template',
    action: handlers.switchToLongTask || (() => {})
  },

  // Action shortcuts
  'ctrl+enter': {
    key: 'ctrl+enter',
    description: 'Send message',
    action: handlers.sendMessage || (() => {})
  },
  'ctrl+shift+v': {
    key: 'ctrl+shift+v',
    description: 'Toggle voice input',
    action: handlers.toggleVoice || (() => {})
  },
  'ctrl+s': {
    key: 'ctrl+s',
    description: 'Save settings',
    action: handlers.saveSettings || (() => {})
  },
  'ctrl+,': {
    key: 'ctrl+,',
    description: 'Open settings',
    action: handlers.openSettings || (() => {})
  },
  'ctrl+shift+s': {
    key: 'ctrl+shift+s',
    description: 'Sync to cloud',
    action: handlers.syncToCloud || (() => {})
  },
  'ctrl+shift+l': {
    key: 'ctrl+shift+l',
    description: 'Load from cloud',
    action: handlers.loadFromCloud || (() => {})
  },

  // UI shortcuts
  'ctrl+shift+d': {
    key: 'ctrl+shift+d',
    description: 'Toggle dark/light theme',
    action: handlers.toggleTheme || (() => {})
  },
  'ctrl+shift+f': {
    key: 'ctrl+shift+f',
    description: 'Toggle fullscreen',
    action: handlers.toggleFullscreen || (() => {})
  },
  'ctrl+shift+h': {
    key: 'ctrl+shift+h',
    description: 'Show/hide sidebar',
    action: handlers.toggleSidebar || (() => {})
  },

  // File shortcuts
  'ctrl+o': {
    key: 'ctrl+o',
    description: 'Open file',
    action: handlers.openFile || (() => {})
  },
  'ctrl+shift+o': {
    key: 'ctrl+shift+o',
    description: 'Open folder',
    action: handlers.openFolder || (() => {})
  },
  'ctrl+shift+e': {
    key: 'ctrl+shift+e',
    description: 'Export conversation',
    action: handlers.exportConversation || (() => {})
  },

  // AI shortcuts
  'ctrl+shift+a': {
    key: 'ctrl+shift+a',
    description: 'Activate multi-agent mode',
    action: handlers.activateMultiAgent || (() => {})
  },
  'ctrl+shift+c': {
    key: 'ctrl+shift+c',
    description: 'Clear conversation',
    action: handlers.clearConversation || (() => {})
  },
  'ctrl+shift+m': {
    key: 'ctrl+shift+m',
    description: 'Toggle memory bank',
    action: handlers.toggleMemoryBank || (() => {})
  },

  // Help shortcuts
  'f1': {
    key: 'f1',
    description: 'Show help',
    action: handlers.showHelp || (() => {})
  },
  'escape': {
    key: 'escape',
    description: 'Close modals/panels',
    action: handlers.closeModals || (() => {})
  }
});