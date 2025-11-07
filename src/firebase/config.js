import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  // For demo purposes, using a public config
  // In production, these should be environment variables
  apiKey: "AIzaSyBvOkBwJ1XqY8Q9R2S3T4U5V6W7X8Y9Z0",
  authDomain: "ai-worker-plus-demo.firebaseapp.com",
  projectId: "ai-worker-plus-demo",
  storageBucket: "ai-worker-plus-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.MODE === 'development') {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, "localhost", 9199);
  } catch (error) {
    console.log('Firebase emulators not running, using production services', error);
  }
}

export default app;