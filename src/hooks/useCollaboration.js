import { useState, useEffect, useCallback } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Collaboration hook for real-time collaboration features
export const useCollaboration = (user) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a new workspace
  const createWorkspace = useCallback(async (workspaceData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const workspace = {
        name: workspaceData.name,
        description: workspaceData.description || '',
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          isPublic: workspaceData.isPublic || false,
          allowComments: workspaceData.allowComments !== false,
          allowFileUpload: workspaceData.allowFileUpload !== false,
          maxCollaborators: workspaceData.maxCollaborators || 10
        },
        collaborators: [{
          userId: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          role: 'owner',
          joinedAt: serverTimestamp()
        }]
      };

      const docRef = await addDoc(collection(db, 'workspaces'), workspace);
      const newWorkspace = { id: docRef.id, ...workspace };
      
      setWorkspaces(prev => [newWorkspace, ...prev]);
      setCurrentWorkspace(newWorkspace);
      
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Join a workspace
  const joinWorkspace = useCallback(async (workspaceId) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const workspaceRef = doc(db, 'workspaces', workspaceId);
      
      // Add user to collaborators
      const collaborator = {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        role: 'member',
        joinedAt: serverTimestamp()
      };

      await updateDoc(workspaceRef, {
        collaborators: [...(currentWorkspace?.collaborators || []), collaborator],
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCurrentWorkspace(prev => ({
        ...prev,
        collaborators: [...(prev?.collaborators || []), collaborator]
      }));

    } catch (error) {
      console.error('Error joining workspace:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWorkspace]);

  // Leave a workspace
  const leaveWorkspace = useCallback(async (workspaceId) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const workspaceRef = doc(db, 'workspaces', workspaceId);
      
      // Remove user from collaborators
      const updatedCollaborators = (currentWorkspace?.collaborators || [])
        .filter(collab => collab.userId !== user.uid);

      await updateDoc(workspaceRef, {
        collaborators: updatedCollaborators,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCurrentWorkspace(prev => ({
        ...prev,
        collaborators: updatedCollaborators
      }));

    } catch (error) {
      console.error('Error leaving workspace:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWorkspace]);

  // Update workspace settings
  const updateWorkspaceSettings = useCallback(async (workspaceId, settings) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const workspaceRef = doc(db, 'workspaces', workspaceId);
      
      await updateDoc(workspaceRef, {
        settings: { ...currentWorkspace?.settings, ...settings },
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCurrentWorkspace(prev => ({
        ...prev,
        settings: { ...prev?.settings, ...settings }
      }));

    } catch (error) {
      console.error('Error updating workspace settings:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWorkspace]);

  // Get user's workspaces
  const getUserWorkspaces = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const workspacesRef = collection(db, 'workspaces');
      const q = query(
        workspacesRef,
        where('collaborators', 'array-contains', { userId: user.uid }),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const workspacesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWorkspaces(workspacesData);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error getting workspaces:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Set current workspace
  const setActiveWorkspace = useCallback((workspace) => {
    setCurrentWorkspace(workspace);
    setCollaborators(workspace?.collaborators || []);
  }, []);

  // Add comment to workspace
  const addComment = useCallback(async (workspaceId, commentData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const comment = {
        workspaceId,
        content: commentData.content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: commentData.type || 'comment', // comment, suggestion, question
        status: commentData.status || 'active',
        replies: []
      };

      await addDoc(collection(db, 'comments'), comment);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error.message);
      throw error;
    }
  }, [user]);

  // Get workspace comments
  const getWorkspaceComments = useCallback(async (workspaceId) => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('workspaceId', '==', workspaceId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const comments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Update comments in workspace state
        setCurrentWorkspace(prev => ({
          ...prev,
          comments
        }));
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error getting comments:', error);
      setError(error.message);
    }
  }, []);

  // Update user role in workspace
  const updateUserRole = useCallback(async (workspaceId, userId, newRole) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const workspaceRef = doc(db, 'workspaces', workspaceId);
      
      // Check if current user is owner
      const isOwner = currentWorkspace?.collaborators?.find(
        collab => collab.userId === user.uid
      )?.role === 'owner';

      if (!isOwner) {
        throw new Error('Only workspace owners can update user roles');
      }

      // Update collaborator role
      const updatedCollaborators = (currentWorkspace?.collaborators || []).map(collab =>
        collab.userId === userId ? { ...collab, role: newRole } : collab
      );

      await updateDoc(workspaceRef, {
        collaborators: updatedCollaborators,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCurrentWorkspace(prev => ({
        ...prev,
        collaborators: updatedCollaborators
      }));

    } catch (error) {
      console.error('Error updating user role:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWorkspace]);

  // Remove user from workspace
  const removeUser = useCallback(async (workspaceId, userId) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);

      const workspaceRef = doc(db, 'workspaces', workspaceId);
      
      // Check if current user is owner
      const isOwner = currentWorkspace?.collaborators?.find(
        collab => collab.userId === user.uid
      )?.role === 'owner';

      if (!isOwner) {
        throw new Error('Only workspace owners can remove users');
      }

      // Remove user from collaborators
      const updatedCollaborators = (currentWorkspace?.collaborators || [])
        .filter(collab => collab.userId !== userId);

      await updateDoc(workspaceRef, {
        collaborators: updatedCollaborators,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCurrentWorkspace(prev => ({
        ...prev,
        collaborators: updatedCollaborators
      }));

    } catch (error) {
      console.error('Error removing user:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWorkspace]);

  // Load user workspaces on mount
  useEffect(() => {
    if (user) {
      getUserWorkspaces();
    }
  }, [user, getUserWorkspaces]);

  return {
    // State
    workspaces,
    currentWorkspace,
    collaborators,
    isLoading,
    error,

    // Actions
    createWorkspace,
    joinWorkspace,
    leaveWorkspace,
    updateWorkspaceSettings,
    setActiveWorkspace,
    addComment,
    getWorkspaceComments,
    updateUserRole,
    removeUser,
    getUserWorkspaces,

    // Utilities
    clearError: () => setError(null)
  };
};