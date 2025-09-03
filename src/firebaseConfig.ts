import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

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

console.log('🔍 Environment variables check:');
console.log('- API Key present:', !!process.env.REACT_APP_FIREBASE_API_KEY);
console.log('- Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('- Database URL:', process.env.REACT_APP_FIREBASE_DATABASE_URL);

// Initialize Firebase
let app: any | null = null;
let db: any | null = null;
let firestore: any | null = null;
let auth: any | null = null;
let database: any | null = null;

// DISABLE FIREBASE INITIALIZATION HERE TO PREVENT CONFLICTS
// firebase.ts handles all Firebase initialization
console.log('⚠️ [firebaseConfig.ts] Skipping initialization - using firebase.ts instead');

// Flag to prevent duplicate initialization
let isInitialized = false;

// Comment out all initialization to prevent conflicts
/*
if (!isInitialized) {
  try {
    console.log('🚀 Initializing Firebase app with project:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized:', app);
    
    console.log('🚀 Attempting to get database...');
    if (process.env.REACT_APP_FIREBASE_DATABASE_URL) {
      database = getDatabase(app, process.env.REACT_APP_FIREBASE_DATABASE_URL);
    } else {
      database = getDatabase(app);
    }
    db = database;
    console.log('✅ Database initialized:', database);
    
    console.log('🚀 Attempting to get firestore...');
    firestore = getFirestore(app);
    console.log('✅ Firestore initialized:', firestore);
    
    console.log('🚀 Attempting to get auth...');
    auth = getAuth(app);
    console.log('✅ Auth initialized:', auth);
    
    console.log('✅ Firebase initialized successfully with real credentials (auth disabled)');
    isInitialized = true;
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
}
*/

// Export Firebase services
export { app, db, database, firestore, auth };

// Helper function to check if we're using real Firebase
export const isRealFirebase = () => {
  // Always use real Firebase in production deployment
  if (window.location.hostname === 'xrcupid.github.io') {
    console.log('🌐 Production deployment detected - forcing real Firebase');
    return true;
  }
  
  // Check if explicitly set to use real Firebase
  if (process.env.REACT_APP_USE_REAL_FIREBASE === 'false') {
    console.log('🔧 REACT_APP_USE_REAL_FIREBASE is false - using mock Firebase');
    return false;
  }
  
  const hasValidApiKey = !!process.env.REACT_APP_FIREBASE_API_KEY && 
         process.env.REACT_APP_FIREBASE_API_KEY !== 'mock' &&
         process.env.REACT_APP_FIREBASE_API_KEY !== '';
  
  console.log('🔑 Firebase API key check:', {
    hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
    isNotMock: process.env.REACT_APP_FIREBASE_API_KEY !== 'mock',
    isNotEmpty: process.env.REACT_APP_FIREBASE_API_KEY !== '',
    finalResult: hasValidApiKey
  });
  
  return hasValidApiKey;
};

console.log('🔥 Using real Firebase:', isRealFirebase());
