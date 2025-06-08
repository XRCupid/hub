import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';

type AuthContextType = {
  currentUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<{ user: FirebaseUser | null }>;
  signup: (email: string, password: string) => Promise<{ user: FirebaseUser | null }>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user };
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth not available, skipping auth state listener');
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
