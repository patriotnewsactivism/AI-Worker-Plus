import React, { memo, useState } from 'react';
import { Users, Plus, Settings, UserPlus, MessageSquare, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

const WorkspaceManager = memo(({ 
  workspaces, 
  currentWorkspace, 
  collaborators, 
  isLoading, 
  onCreateWorkspace, 
  onJoinWorkspace, 
  onLeaveWorkspace, 
  onSetActiveWorkspace,
  onUpdateSettings,
  onAddComment,
  onUpdateUserRole,
  onRemoveUser
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
    isPublic: false,
    allowComments: true,
    allowFileUpload: true,
    maxCollaborators: 10
  });
  const [joinCode, setJoinCode] = useState('');
  const [newComment, setNewComment] = useState('');

  const handleCreateWorkspace = (e) => {
    e.preventDefault();
    onCreateWorkspace(newWorkspace);
    setNewWorkspace({
      name: '',
      description: '',
      isPublic: false,
      allowComments: true,
      allowFileUpload: true,
      maxCollaborators: 10
    });
    setShowCreateForm(false);
  };

  const handleJoinWorkspace = (e) => {
    e.preventDefault();
    onJoinWorkspace(joinCode);
    setJoinCode('');
    setShowJoinForm(false);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim() && currentWorkspace) {
      onAddComment(currentWorkspace.id, { content: newComment.trim() });
      setNewComment('');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return '#ef4444';
      case 'admin': return '#f59e0b';
      case 'member': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return '👑';
      case 'admin': return '⚡';
      case 'member': return '👤';
      default: return '👤';
    }
  };

  return (
    <div className="workspace-manager">
      <div className="workspace-header">
        <h3><Users size={18} /> Workspaces</h3>
        <div className="workspace-actions">
          <button
            className="action-btn"
            onClick={() => setShowCreateForm(true)}
            title="Create workspace"
          >
            <Plus size={16} />
          </button>
          <button
            className="action-btn"
            onClick={() => setShowJoinForm(true)}
            title="Join workspace"
          >
            <UserPlus size={16} />
          </button>
        </div>
      </div>

      {/* Workspace List */}
      <div className="workspace-list">
        {workspaces.map(workspace => (
          <div
            key={workspace.id}
            className={`workspace-item ${currentWorkspace?.id === workspace.id ? 'active' : ''}`}
            onClick={() => onSetActiveWorkspace(workspace)}
          >
            <div className="workspace-info">
              <div className="workspace-name">
                {workspace.name}
                {workspace.settings?.isPublic ? (
                  <Eye size={14} title="Public" />
                ) : (
                  <Lock size={14} title="Private" />
                )}
              </div>
              <div className="workspace-description">
                {workspace.description || 'No description'}
              </div>
              <div className="workspace-meta">
                <span className="collaborator-count">
                  {workspace.collaborators?.length || 0} members
                </span>
                <span className="workspace-role">
                  {getRoleIcon(workspace.collaborators?.find(c => c.userId === workspace.ownerId)?.role || 'owner')}
                </span>
              </div>
            </div>
            <div className="workspace-actions">
              <button
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(true);
                }}
                title="Settings"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Current Workspace Details */}
      {currentWorkspace && (
        <div className="current-workspace">
          <div className="workspace-details">
            <h4>{currentWorkspace.name}</h4>
            <p>{currentWorkspace.description || 'No description'}</p>
            
            <div className="workspace-settings">
              <div className="setting-item">
                <span>Visibility:</span>
                <span className={currentWorkspace.settings?.isPublic ? 'public' : 'private'}>
                  {currentWorkspace.settings?.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="setting-item">
                <span>Comments:</span>
                <span className={currentWorkspace.settings?.allowComments ? 'enabled' : 'disabled'}>
                  {currentWorkspace.settings?.allowComments ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="setting-item">
                <span>File Upload:</span>
                <span className={currentWorkspace.settings?.allowFileUpload ? 'enabled' : 'disabled'}>
                  {currentWorkspace.settings?.allowFileUpload ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Collaborators */}
          <div className="collaborators-section">
            <h5>Collaborators ({collaborators.length})</h5>
            <div className="collaborators-list">
              {collaborators.map(collaborator => (
                <div key={collaborator.userId} className="collaborator-item">
                  <div className="collaborator-info">
                    <span className="collaborator-name">
                      {collaborator.displayName || collaborator.email}
                    </span>
                    <span 
                      className="collaborator-role"
                      style={{ color: getRoleColor(collaborator.role) }}
                    >
                      {getRoleIcon(collaborator.role)} {collaborator.role}
                    </span>
                  </div>
                  <div className="collaborator-actions">
                    <select
                      value={collaborator.role}
                      onChange={(e) => onUpdateUserRole(currentWorkspace.id, collaborator.userId, e.target.value)}
                      className="role-select"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                    <button
                      className="remove-btn"
                      onClick={() => onRemoveUser(currentWorkspace.id, collaborator.userId)}
                      title="Remove user"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          {currentWorkspace.settings?.allowComments && (
            <div className="comments-section">
              <div className="comments-header">
                <h5>Comments</h5>
                <button
                  className="toggle-btn"
                  onClick={() => setShowComments(!showComments)}
                >
                  {showComments ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {showComments && (
                <div className="comments-content">
                  <form onSubmit={handleAddComment} className="comment-form">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="comment-input"
                    />
                    <button type="submit" className="comment-btn">
                      <MessageSquare size={16} />
                    </button>
                  </form>
                  
                  <div className="comments-list">
                    {currentWorkspace.comments?.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">{comment.authorName}</span>
                          <span className="comment-time">
                            {new Date(comment.createdAt?.toDate()).toLocaleString()}
                          </span>
                        </div>
                        <div className="comment-content">{comment.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create Workspace</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="modal-content">
              <div className="form-group">
                <label>Workspace Name</label>
                <input
                  type="text"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newWorkspace.description}
                  onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newWorkspace.isPublic}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  Public workspace
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newWorkspace.allowComments}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, allowComments: e.target.checked }))}
                  />
                  Allow comments
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newWorkspace.allowFileUpload}
                    onChange={(e) => setNewWorkspace(prev => ({ ...prev, allowFileUpload: e.target.checked }))}
                  />
                  Allow file uploads
                </label>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Workspace Modal */}
      {showJoinForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Join Workspace</h3>
              <button className="close-btn" onClick={() => setShowJoinForm(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleJoinWorkspace} className="modal-content">
              <div className="form-group">
                <label>Workspace ID or Invite Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter workspace ID or invite code"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowJoinForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

WorkspaceManager.displayName = 'WorkspaceManager';

export default WorkspaceManager;