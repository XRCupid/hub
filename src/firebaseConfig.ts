import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
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

console.log('🔍 Environment variables check:');
console.log('- API Key present:', !!process.env.REACT_APP_FIREBASE_API_KEY);
console.log('- Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('- Database URL:', process.env.REACT_APP_FIREBASE_DATABASE_URL);

// Initialize Firebase
let app: FirebaseApp;
let db: Database | null = null;
let firestore: Firestore;
let auth: Auth;
let database: Database | null = null;

// Flag to prevent duplicate initialization
let isInitialized = false;

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
    
    // Sign in anonymously for Firestore/Database access
    signInAnonymously(auth)
      .then(() => {
        console.log('✅ Signed in anonymously');
      })
      .catch((error) => {
        console.error('❌ Anonymous auth error:', error);
      });
    
    console.log('✅ Firebase initialized successfully with real credentials');
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

// Export Firebase services
export { app, db, database, firestore, auth };

// Helper function to check if we're using real Firebase
export const isRealFirebase = () => {
  // Check if explicitly set to use real Firebase
  if (process.env.REACT_APP_USE_REAL_FIREBASE === 'false') {
    return false;
  }
  
  return !!process.env.REACT_APP_FIREBASE_API_KEY && 
         process.env.REACT_APP_FIREBASE_API_KEY !== 'mock' &&
         process.env.REACT_APP_FIREBASE_API_KEY !== '';
};

console.log('🔥 Using real Firebase:', isRealFirebase());
