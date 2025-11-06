import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// Cloud sync hook for data persistence
export const useCloudSync = (user) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  const [syncError, setSyncError] = useState(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync user data to cloud
  const syncUserData = useCallback(async (data) => {
    if (!user) return;

    try {
      setSyncStatus('syncing');
      setSyncError(null);

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...data,
        lastUpdated: serverTimestamp(),
        userId: user.uid
      }, { merge: true });

      setLastSync(new Date());
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.message);
      setSyncStatus('error');
    }
  }, [user]);

  // Get user data from cloud
  const getUserData = useCallback(async () => {
    if (!user) return null;

    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      setSyncError(error.message);
      return null;
    }
  }, [user]);

  // Sync conversation to cloud
  const syncConversation = useCallback(async (conversation) => {
    if (!user) return;

    try {
      setSyncStatus('syncing');
      
      const conversationRef = doc(db, 'conversations', conversation.id);
      await setDoc(conversationRef, {
        ...conversation,
        userId: user.uid,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      setLastSync(new Date());
      setSyncStatus('idle');
    } catch (error) {
      console.error('Conversation sync error:', error);
      setSyncError(error.message);
      setSyncStatus('error');
    }
  }, [user]);

  // Get conversations from cloud
  const getConversations = useCallback(async (limitCount = 50) => {
    if (!user) return [];

    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('userId', '==', user.uid),
        orderBy('lastUpdated', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting conversations:', error);
      setSyncError(error.message);
      return [];
    }
  }, [user]);

  // Upload file to cloud storage
  const uploadFile = useCallback(async (file, path) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setSyncStatus('syncing');
      
      const fileRef = ref(storage, `users/${user.uid}/${path}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setLastSync(new Date());
      setSyncStatus('idle');
      
      return {
        url: downloadURL,
        path: path,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('File upload error:', error);
      setSyncError(error.message);
      setSyncStatus('error');
      throw error;
    }
  }, [user]);

  // Delete file from cloud storage
  const deleteFile = useCallback(async (path) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const fileRef = ref(storage, `users/${user.uid}/${path}`);
      await deleteObject(fileRef);
      
      setLastSync(new Date());
    } catch (error) {
      console.error('File delete error:', error);
      setSyncError(error.message);
      throw error;
    }
  }, [user]);

  // Real-time sync listener
  const useRealtimeSync = useCallback((callback) => {
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
        setLastSync(new Date());
      }
    }, (error) => {
      console.error('Realtime sync error:', error);
      setSyncError(error.message);
    });
  }, [user]);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setSyncError(null);
    setSyncStatus('idle');
  }, []);

  return {
    isOnline,
    lastSync,
    syncStatus,
    syncError,
    syncUserData,
    getUserData,
    syncConversation,
    getConversations,
    uploadFile,
    deleteFile,
    useRealtimeSync,
    clearSyncError
  };
};