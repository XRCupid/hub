import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

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
  console.log('🚀 Attempting to initialize Firebase app...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized:', app);
  
  console.log('🚀 Attempting to get database...');
  database = getDatabase(app);
  db = database;
  console.log('✅ Database initialized:', database);
  
  console.log('🚀 Attempting to get firestore...');
  firestore = getFirestore(app);
  console.log('✅ Firestore initialized:', firestore);
  
  console.log('🚀 Attempting to get auth...');
  auth = getAuth(app);
  console.log('✅ Auth initialized:', auth);
  
  console.log('✅ Firebase initialized successfully with real credentials');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  if (error instanceof Error) {
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  } else {
    console.error('❌ Unknown error:', error);
  }
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
