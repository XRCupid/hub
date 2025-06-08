import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/database';

console.log('🔥 Firebase.ts module is loading...');

// Firebase v9 modular SDK mock support
class MockSnapshot {
  private data: any;
  private path: string;
  private keyName: string | null;

  constructor(data: any, path: string, key: string | null = null) {
    this.data = data;
    this.path = path;
    this.keyName = key;
  }

  val() {
    return this.data;
  }

  get key() {
    return this.keyName;
  }

  exists() {
    return this.data !== null && this.data !== undefined;
  }
}

// Mock reference for v9 style
class MockRefV9 {
  private path: string;
  private static globalData: { [key: string]: any } = {};
  private listeners: { [key: string]: any[] } = {};

  constructor(path: string) {
    this.path = path;
  }

  private getPathData() {
    const pathParts = this.path.split('/').filter(p => p);
    let current = MockRefV9.globalData;
    
    for (const part of pathParts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    return current;
  }

  private setPathData(data: any) {
    const pathParts = this.path.split('/').filter(p => p);
    let current = MockRefV9.globalData;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    if (pathParts.length > 0) {
      current[pathParts[pathParts.length - 1]] = data;
    } else {
      MockRefV9.globalData = data;
    }
  }

  child(path: string) {
    return new MockRefV9(`${this.path}/${path}`);
  }
}

// Mock functions for v9 modular style
export const ref = (database: any, path: string) => {
  console.log(`MockDB v9: Creating ref for path: ${path}`);
  return new MockRefV9(path);
};

export const set = (ref: MockRefV9, data: any): Promise<void> => {
  console.log(`MockDB v9: Setting data at ${(ref as any).path}:`, data);
  (ref as any).setPathData(data);
  return Promise.resolve();
};

export const onValue = (ref: MockRefV9, callback: any, options?: any): () => void => {
  console.log(`MockDB v9: Adding onValue listener at ${(ref as any).path}`);
  
  // Simulate immediate callback with current data
  setTimeout(() => {
    const data = (ref as any).getPathData();
    const snapshot = new MockSnapshot(data, (ref as any).path);
    callback(snapshot);
  }, 100);
  
  // Return unsubscribe function
  return () => {
    console.log(`MockDB v9: Unsubscribing onValue listener at ${(ref as any).path}`);
  };
};

export const onChildAdded = (ref: MockRefV9, callback: any): () => void => {
  console.log(`MockDB v9: Adding onChildAdded listener at ${(ref as any).path}`);
  
  // Store callback for later triggering
  if (!(ref as any).listeners.child_added) {
    (ref as any).listeners.child_added = [];
  }
  (ref as any).listeners.child_added.push(callback);
  
  // Return unsubscribe function
  return () => {
    console.log(`MockDB v9: Unsubscribing onChildAdded listener at ${(ref as any).path}`);
    if ((ref as any).listeners.child_added) {
      (ref as any).listeners.child_added = (ref as any).listeners.child_added.filter((cb: any) => cb !== callback);
    }
  };
};

export const onChildRemoved = (ref: MockRefV9, callback: any): () => void => {
  console.log(`MockDB v9: Adding onChildRemoved listener at ${(ref as any).path}`);
  
  // Return unsubscribe function
  return () => {
    console.log(`MockDB v9: Unsubscribing onChildRemoved listener at ${(ref as any).path}`);
  };
};

export const remove = (ref: MockRefV9): Promise<void> => {
  console.log(`MockDB v9: Removing data at ${(ref as any).path}`);
  (ref as any).setPathData(null);
  return Promise.resolve();
};

export const update = (ref: MockRefV9, updates: any): Promise<void> => {
  console.log(`MockDB v9: Updating data at ${(ref as any).path}:`, updates);
  const currentData = (ref as any).getPathData();
  const mergedData = { ...currentData, ...updates };
  (ref as any).setPathData(mergedData);
  return Promise.resolve();
};

console.log('🔥 Firebase imported successfully:', typeof firebase);

// Create a comprehensive mock Firebase database for local development
class MockDatabaseRef {
  private path: string;
  private data: any = null;
  private listeners: { [key: string]: any[] } = {};

  constructor(path: string) {
    this.path = path;
  }

  set(data: any): Promise<void> {
    console.log(`MockDB: Setting data at ${this.path}:`, data);
    this.data = data;
    return Promise.resolve();
  }

  on(eventType: string, callback: any): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    console.log(`MockDB: Added listener for ${eventType} at ${this.path}`);
  }

  off(eventType?: string, callback?: any): void {
    if (eventType && this.listeners[eventType]) {
      if (callback) {
        this.listeners[eventType] = this.listeners[eventType].filter(cb => cb !== callback);
      } else {
        this.listeners[eventType] = [];
      }
    }
    console.log(`MockDB: Removed listener for ${eventType} at ${this.path}`);
  }

  once(eventType: string, callback: any): Promise<any> {
    console.log(`MockDB: Once listener for ${eventType} at ${this.path}`);
    const mockSnapshot = { val: () => this.data };
    callback(mockSnapshot);
    return Promise.resolve(mockSnapshot);
  }

  push(data: any): { key: string } {
    const key = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`MockDB: Pushing data to ${this.path} with key ${key}:`, data);
    return { key };
  }

  remove(): Promise<void> {
    console.log(`MockDB: Removing data at ${this.path}`);
    this.data = null;
    return Promise.resolve();
  }
}

class MockDatabase {
  ref(path: string): MockDatabaseRef {
    return new MockDatabaseRef(path);
  }
}

// Your web app's Firebase configuration with fallbacks for development
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "xrcupid-demo.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://xrcupid-demo-default-rtdb.firebaseio.com/",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "xrcupid-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "xrcupid-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:demo",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-DEMO"
};

console.log('Firebase config:', firebaseConfig);
console.log('🔍 Environment variables check:');
console.log('- API Key present:', !!process.env.REACT_APP_FIREBASE_API_KEY);
console.log('- API Key value:', process.env.REACT_APP_FIREBASE_API_KEY ? 'HIDDEN' : 'MISSING');
console.log('- Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('- Database URL:', process.env.REACT_APP_FIREBASE_DATABASE_URL);

// Initialize Firebase with fallback to mock
let app: firebase.app.App | undefined;
let firestore: firebase.firestore.Firestore | undefined;
let auth: firebase.auth.Auth | undefined;
let database: firebase.database.Database | MockDatabase;

// Use real Firebase if API key is provided, otherwise use mock for development
if (process.env.REACT_APP_FIREBASE_API_KEY && process.env.REACT_APP_FIREBASE_API_KEY !== "demo-api-key") {
  try {
    console.log('🚀 Initializing real Firebase with project:', firebaseConfig.projectId);
    
    // Initialize Firebase app
    app = firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    // Initialize services
    firestore = firebase.firestore();
    auth = firebase.auth();
    
    // Initialize database with explicit reference
    const dbInstance = firebase.database();
    console.log('🔍 Raw database instance:', dbInstance);
    console.log('🔍 Database ref method before assignment:', typeof dbInstance.ref);
    
    // Ensure database is properly initialized
    database = dbInstance;
    
    console.log('✅ Firebase initialized successfully with real credentials');
    console.log('✅ Database URL:', firebaseConfig.databaseURL);
    console.log('✅ Database instance type:', typeof database);
    console.log('✅ Database ref method:', typeof database.ref);
    console.log('✅ Database constructor:', database.constructor.name);
  } catch (error) {
    console.error('❌ Firebase initialization failed, falling back to mock:', error);
    console.log('🔄 Creating mock database fallback...');
    database = new MockDatabase();
    console.log('✅ Mock database created, ref method:', typeof database.ref);
  }
} else {
  console.log('🔄 Using mock Firebase database for local development (no API key provided)');
  database = new MockDatabase();
  console.log('✅ Mock database created, ref method:', typeof database.ref);
  
  // Mock other Firebase services if needed
  firestore = undefined;
  auth = undefined;
}

console.log('📋 Final database instance:', database);
console.log('📋 Database ref function available:', typeof database?.ref);
console.log('📋 Database constructor:', database.constructor.name);
console.log('📋 About to export database:', database);

export { firestore, auth, database, firebase as default };

console.log('📤 Export completed.');
