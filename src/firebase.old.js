import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, push, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';

console.log('🔥 Firebase.js module is loading...');

// Mock Firebase Database implementation using localStorage for cross-window sharing
const MOCK_STORE_KEY = 'xrcupid_mock_firebase_store';

// Get shared store from localStorage
function getMockStore() {
  try {
    const stored = localStorage.getItem(MOCK_STORE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Error reading from localStorage:', error);
    return {};
  }
}

// Save store to localStorage
function saveMockStore(store) {
  try {
    localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('Error saving to localStorage:', error);
  }
}

class MockDatabaseRef {
  constructor(path) {
    this.path = path;
    this.listeners = [];
    console.log(`📝 Mock ref created for path: ${path}`);
  }

  set(value, callback) {
    console.log(`📝 Mock set on ${this.path}:`, value);
    
    // Get current store and merge with new value
    const mockStore = getMockStore();
    this._setValue(mockStore, this.path, value);
    saveMockStore(mockStore);
    
    // Trigger any listeners that might be watching this path or parent paths
    this._triggerListeners('value', value);
    
    // Handle callback with Firebase v8 style
    if (callback) {
      setTimeout(() => {
        try {
          callback(null); // null means no error
        } catch (error) {
          console.error('Error in set callback:', error);
        }
      }, 10);
    }
    
    return Promise.resolve();
  }

  _setValue(mockStore, path, value) {
    const pathParts = path.split('/').filter(p => p);
    let current = mockStore;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    if (pathParts.length > 0) {
      current[pathParts[pathParts.length - 1]] = value;
    } else {
      Object.assign(mockStore, value);
    }
    
    console.log('📝 Mock store after setValue:', JSON.stringify(mockStore, null, 2));
  }

  _getValue(path) {
    const mockStore = getMockStore();
    console.log('📝 Mock store contents for path', path, ':', JSON.stringify(mockStore, null, 2));
    const pathParts = path.split('/').filter(p => p);
    let current = mockStore;
    
    for (const part of pathParts) {
      if (!current || !current[part]) {
        console.log('📝 Path part not found:', part, 'in', current);
        return null;
      }
      current = current[part];
    }
    
    console.log('📝 Found value for path', path, ':', current);
    return current;
  }

  _triggerListeners(eventType, value) {
    this.listeners.forEach(listener => {
      if (listener.eventType === eventType) {
        listener.callback({ 
          val: () => value,
          key: this.path.split('/').pop()
        });
      }
    });
  }

  on(eventType, callback) {
    console.log(`📝 Mock listener added for ${this.path}, event: ${eventType}`);
    
    this.listeners.push({ eventType, callback });
    
    // For 'child_added', simulate existing children
    if (eventType === 'child_added') {
      const currentValue = this._getValue(this.path);
      if (currentValue && typeof currentValue === 'object') {
        Object.keys(currentValue).forEach(key => {
          setTimeout(() => {
            callback({
              val: () => currentValue[key],
              key: key
            });
          }, 10);
        });
      }
    } else if (eventType === 'value') {
      // Return current value immediately
      const currentValue = this._getValue(this.path);
      setTimeout(() => {
        callback({ 
          val: () => currentValue,
          key: this.path.split('/').pop()
        });
      }, 10);
    }
  }

  off(eventType, callback) {
    console.log(`📝 Mock listener removed for ${this.path}, event: ${eventType}`);
    this.listeners = this.listeners.filter(
      listener => !(listener.eventType === eventType && listener.callback === callback)
    );
  }

  once(eventType, callback, errorCallback) {
    console.log(`📝 Mock once for ${this.path}, event: ${eventType}`);
    const currentValue = this._getValue(this.path);
    
    // Support both callback and promise syntax
    if (callback) {
      // Firebase v8 callback style
      setTimeout(() => {
        try {
          const snapshot = { 
            val: () => currentValue,
            key: this.path.split('/').pop(),
            exists: () => currentValue !== null && currentValue !== undefined
          };
          callback(snapshot);
        } catch (error) {
          if (errorCallback) {
            errorCallback(error);
          }
        }
      }, 10);
    } else {
      // Promise style fallback
      return Promise.resolve({ 
        val: () => currentValue,
        key: this.path.split('/').pop(),
        exists: () => currentValue !== null && currentValue !== undefined
      });
    }
  }

  push(value) {
    console.log(`📝 Mock push to ${this.path}:`, value);
    const mockKey = `mock_${Date.now()}`;
    const newPath = `${this.path}/${mockKey}`;
    const mockStore = getMockStore();
    this._setValue(mockStore, newPath, value);
    saveMockStore(mockStore);
    
    // Trigger child_added listeners
    this.listeners.forEach(listener => {
      if (listener.eventType === 'child_added') {
        listener.callback({
          val: () => value,
          key: mockKey
        });
      }
    });
    
    return Promise.resolve({ key: mockKey });
  }

  remove() {
    console.log(`📝 Mock remove for ${this.path}`);
    // Simple removal - just set to null
    const mockStore = getMockStore();
    this._setValue(mockStore, this.path, null);
    saveMockStore(mockStore);
    return Promise.resolve();
  }
}

class MockDatabase {
  ref(path = '/') {
    return new MockDatabaseRef(path);
  }
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('🔍 Environment variables check:');
console.log('- API Key present:', !!process.env.REACT_APP_FIREBASE_API_KEY);
console.log('- Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
console.log('- Database URL:', process.env.REACT_APP_FIREBASE_DATABASE_URL);

let database;
let auth;

// DISABLED: Firebase initialization moved to firebaseConfig.ts to prevent duplicate app error
if (false) { // Disabled to prevent duplicate Firebase initialization
  // FORCE MOCK FOR LOCAL DEVELOPMENT TO AVOID CALLBACK ISSUES
  const FORCE_MOCK_FOR_DEV = process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_REAL_FIREBASE !== 'true';

  if (process.env.REACT_APP_FIREBASE_API_KEY && process.env.REACT_APP_FIREBASE_API_KEY.length > 10 && !FORCE_MOCK_FOR_DEV) {
    try {
      console.log('🚀 Initializing real Firebase with project:', firebaseConfig.projectId);
      const app = initializeApp(firebaseConfig);
      const realDatabase = getDatabase(app);
      auth = getAuth(app);

      // Create a wrapper that provides v8-style ref() method
      database = {
        ref: (path = '/') => {
          const dbRef = ref(realDatabase, path);
          return {
            set: (value, callback) => {
              const promise = set(dbRef, value);
              if (callback) {
                promise.then(() => callback(null)).catch(callback);
              }
              return promise;
            },
            on: (eventType, callback) => onValue(dbRef, callback),
            off: (eventType, callback) => off(dbRef, eventType, callback),
            once: (eventType, callback, errorCallback) => {
              if (callback) {
                let unsubscribe;
                unsubscribe = onValue(dbRef, (snapshot) => {
                  unsubscribe();
                  callback(snapshot);
                }, errorCallback);
              } else {
                // Promise style fallback
                return new Promise((resolve, reject) => {
                  let unsubscribe;
                  unsubscribe = onValue(dbRef, (snapshot) => {
                    unsubscribe();
                    resolve(snapshot);
                  }, reject);
                });
              }
            },
            push: (value) => {
              const newRef = push(dbRef);
              return set(newRef, value).then(() => ({ key: newRef.key }));
            },
            remove: () => remove(dbRef)
          };
        }
      };

      console.log('✅ Firebase initialized successfully with real credentials');
      console.log('✅ Database ref method available:', typeof database.ref);
    } catch (error) {
      console.error('❌ Firebase initialization failed, falling back to mock:', error);
      database = new MockDatabase();
      auth = undefined;
    }
  } else {
    console.log('🔄 Using mock Firebase database for local development (no API key provided or FORCE_MOCK_FOR_DEV)');
    database = new MockDatabase();
    auth = undefined;
  }
} else {
  console.log('🔄 Using mock Firebase database for local development (no API key provided or FORCE_MOCK_FOR_DEV)');
  database = new MockDatabase();
  auth = undefined;
}

console.log('📋 Final database instance:', database);
console.log('📋 Database ref function available:', typeof database?.ref);

export { database, auth };
