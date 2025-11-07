import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Demo defaults that can be used when running locally without custom credentials
const demoFirebaseConfig = {
  apiKey: "AIzaSyBvOkBwJ1XqY8Q9R2S3T4U5V6W7X8Y9Z0",
  authDomain: "ai-worker-plus-demo.firebaseapp.com",
  projectId: "ai-worker-plus-demo",
  storageBucket: "ai-worker-plus-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

const firebaseEnvKeyMap = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID'
};

const env = import.meta.env || {};
const isDevelopment = Boolean(env.DEV ?? env.MODE === 'development');

const firebaseConfig = Object.entries(firebaseEnvKeyMap).reduce((config, [configKey, envKey]) => {
  const envValue = env[envKey];

  if (envValue && envValue.trim().length > 0) {
    config[configKey] = envValue;
    return config;
  }

  if (isDevelopment) {
    console.warn(
      `[Firebase] Missing ${envKey} in environment. Falling back to demo configuration for local development.`
    );
    config[configKey] = demoFirebaseConfig[configKey];
    return config;
  }

  const errorMessage = `[Firebase] Missing required environment variable: ${envKey}. Aborting Firebase initialization.`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}, {});

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
