// Type declarations for external modules
declare module 'react-hot-toast';
declare module 'react-icons/fa';
declare module 'react-icons/io';
declare module 'react-icons/bs';
declare module 'react-icons/md';
declare module 'react-icons/ri';

// Firebase and Auth types
declare module 'firebase/app' {
  export function initializeApp(config: any): any;
  // Add other Firebase functions you use
}

declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
  export function doc(db: any, path: string, ...pathSegments: string[]): any;
  export function getDoc(docRef: any): Promise<any>;
  export function updateDoc(docRef: any, data: any): Promise<void>;
  export function arrayUnion(...elements: any[]): any;
  export class Timestamp {
    static now(): Timestamp;
    toDate(): Date;
  }
}

// Auth Context
declare module '../contexts/AuthContext' {
  export function useAuth(): {
    currentUser: any;
    login: (email: string, password: string) => Promise<any>;
    signup: (email: string, password: string) => Promise<any>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateEmail: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
  };
}
