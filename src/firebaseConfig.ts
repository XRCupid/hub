import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Database } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

console.log('🔥 Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : 'NOT SET'
});

// Initialize Firebase
let app;
let db: Database | null = null;
let firestore;
let auth;
let database: Database | null = null;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  db = database;
  firestore = getFirestore(app);
  auth = getAuth(app);
  
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Export Firebase services
export { app, db, database, firestore, auth };

// Helper function to check if we're using real Firebase
export const isRealFirebase = () => {
  return !!process.env.REACT_APP_FIREBASE_API_KEY && 
         process.env.REACT_APP_FIREBASE_API_KEY !== 'mock' &&
         process.env.REACT_APP_FIREBASE_API_KEY !== '';
};

console.log('🔥 Using real Firebase:', isRealFirebase());
