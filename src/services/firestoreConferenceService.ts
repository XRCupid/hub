import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  Timestamp,
  collection,
  DocumentSnapshot,
  Unsubscribe
} from '@firebase/firestore';
import { firestore } from '../firebaseConfig';

class FirestoreConferenceService {
  constructor() {
    console.log('[FirestoreConferenceService] Using Firestore for signaling');
  }

  async createRoom(hostName: string): Promise<string | null> {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomRef = doc(firestore, 'conference-rooms', roomId);
      
      await setDoc(roomRef, {
        id: roomId,
        participants: [hostName],
        host: hostName,
        createdAt: Timestamp.now(),
        status: 'waiting'
      });

      console.log('[FirestoreConferenceService] Room created:', roomId);
      return roomId;
    } catch (error) {
      console.error('[FirestoreConferenceService] Error creating room:', error);
      return null;
    }
  }

  async joinRoom(roomId: string, userName: string): Promise<boolean> {
    try {
      const roomRef = doc(firestore, 'conference-rooms', roomId);
      await updateDoc(roomRef, {
        participants: arrayUnion(userName),
        status: 'active'
      });
      
      console.log('[FirestoreConferenceService] Joined room:', roomId);
      return true;
    } catch (error) {
      console.error('[FirestoreConferenceService] Error joining room:', error);
      return false;
    }
  }

  async getRoom(roomId: string): Promise<any> {
    try {
      const roomRef = doc(firestore, 'conference-rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      return roomDoc.exists() ? roomDoc.data() : null;
    } catch (error) {
      console.error('[FirestoreConferenceService] Error getting room:', error);
      return null;
    }
  }

  onRoomUpdate(roomId: string, callback: (room: any) => void): Unsubscribe {
    const roomRef = doc(firestore, 'conference-rooms', roomId);
    return onSnapshot(roomRef, (doc: DocumentSnapshot) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }

  async sendSignal(roomId: string, from: string, to: string, signal: any): Promise<void> {
    try {
      const signalRef = doc(firestore, 'conference-rooms', roomId, 'signals', `${from}-${to}`);
      await setDoc(signalRef, {
        from,
        to,
        signal,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('[FirestoreConferenceService] Error sending signal:', error);
    }
  }

  onSnapshot(path: string, callback: (data: any) => void): Unsubscribe {
    // Parse the path to get roomId
    const pathParts = path.split('/');
    const roomId = pathParts[1];
    const signalsCollection = collection(firestore, 'conference-rooms', roomId, 'signals');
    
    return onSnapshot(signalsCollection, (snapshot: any) => {
      const signals: any = {};
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (!signals[data.to]) signals[data.to] = {};
        signals[data.to][data.from] = data.signal;
      });
      callback(signals);
    });
  }
}

export const firestoreConferenceService = new FirestoreConferenceService();
