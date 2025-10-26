import React, { memo, useState } from 'react';
import { X, Keyboard, Command, Shift, Alt, Ctrl } from 'lucide-react';

const KeyboardShortcuts = memo(({ isOpen, onClose, shortcuts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (!isOpen) return null;

  // Categorize shortcuts
  const categories = {
    all: 'All Shortcuts',
    navigation: 'Navigation',
    actions: 'Actions',
    ui: 'UI Controls',
    files: 'File Operations',
    ai: 'AI Features',
    help: 'Help'
  };

  const categorizedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'actions';
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {});

  // Filter shortcuts based on search and category
  const filteredShortcuts = Object.entries(categorizedShortcuts)
    .filter(([category]) => selectedCategory === 'all' || category === selectedCategory)
    .reduce((acc, [category, shortcuts]) => {
      const filtered = shortcuts.filter(shortcut =>
        shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    }, {});

  // Render key combination
  const renderKey = (key) => {
    const parts = key.split('+');
    return parts.map((part, index) => (
      <span key={index}>
        {index > 0 && <span className="key-separator">+</span>}
        <kbd className={`key ${part}`}>
          {part === 'ctrl' && <Ctrl size={12} />}
          {part === 'alt' && <Alt size={12} />}
          {part === 'shift' && <Shift size={12} />}
          {part === 'cmd' && <Command size={12} />}
          {!['ctrl', 'alt', 'shift', 'cmd'].includes(part) && part}
        </kbd>
      </span>
    ));
  };

  return (
    <div className="keyboard-shortcuts-overlay">
      <div className="keyboard-shortcuts-modal">
        <div className="shortcuts-header">
          <div className="shortcuts-title">
            <Keyboard size={20} />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="shortcuts-content">
          <div className="shortcuts-search">
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="shortcuts-categories">
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                className={`category-btn ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="shortcuts-list">
            {Object.entries(filteredShortcuts).map(([category, shortcuts]) => (
              <div key={category} className="shortcut-category">
                <h3>{categories[category]}</h3>
                <div className="shortcut-items">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="shortcut-item">
                      <div className="shortcut-keys">
                        {renderKey(shortcut.key)}
                      </div>
                      <div className="shortcut-description">
                        {shortcut.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(filteredShortcuts).length === 0 && (
            <div className="no-shortcuts">
              <p>No shortcuts found matching your search.</p>
            </div>
          )}
        </div>

        <div className="shortcuts-footer">
          <p>Press <kbd>Escape</kbd> to close this dialog</p>
        </div>
      </div>
    </div>
  );
});

KeyboardShortcuts.displayName = 'KeyboardShortcuts';

export default KeyboardShortcuts;