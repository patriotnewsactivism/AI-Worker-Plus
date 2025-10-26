import React, { memo } from 'react';
import { Users, Coffee } from 'lucide-react';
import FileUpload from './FileUpload.jsx';

const Sidebar = memo(({ 
  templates, 
  selectedTemplate, 
  setSelectedTemplate, 
  memoryBank, 
  onFileProcessed, 
  githubConnected, 
  onGitHubConnect, 
  onGitHubPull 
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3><Users size={18} /> AI Templates</h3>
        <div className="template-grid">
          {Object.entries(templates).map(([key, template]) => {
            const IconComponent = template.icon;
            return (
              <button
                key={key}
                className={`template-btn ${selectedTemplate === key ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(key)}
                style={{ '--template-color': template.color }}
              >
                <IconComponent size={20} />
                <span>{key}</span>
                <small>{template.description}</small>
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory Bank */}
      {memoryBank.length > 0 && (
        <div className="sidebar-section">
          <h3><Coffee size={18} /> Memory Bank</h3>
          <div className="memory-bank">
            {memoryBank.map(item => (
              <div key={item.id} className="memory-item">
                <div className="memory-content">{item.content}</div>
                <div className="memory-timestamp">{item.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Workspace */}
      <div className="sidebar-section">
        <FileUpload 
          onFileProcessed={onFileProcessed}
          githubConnected={githubConnected}
          onGitHubConnect={onGitHubConnect}
          onGitHubPull={onGitHubPull}
        />
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;