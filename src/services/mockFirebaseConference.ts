// This ensures the conference demo runs smoothly without real Firebase

interface Room {
  id: string;
  host: string;
  participants: string[] | { [key: string]: any }; // Support both array and object formats
  signals: { [key: string]: any };
  createdAt: number;
}

class MockFirebaseConference {
  private rooms: Map<string, Room> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private STORAGE_KEY = 'xrcupid_mock_rooms';

  constructor() {
    // Load rooms from localStorage on initialization
    this.loadRoomsFromStorage();
  }

  private loadRoomsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const roomsData = JSON.parse(stored);
        Object.entries(roomsData).forEach(([id, room]) => {
          this.rooms.set(id, room as Room);
        });
        console.log('[MockFirebase] Loaded rooms from storage:', this.rooms.size);
      }
    } catch (error) {
      console.error('[MockFirebase] Error loading rooms from storage:', error);
    }
  }

  private saveRoomsToStorage(): void {
    try {
      const roomsData: { [key: string]: Room } = {};
      this.rooms.forEach((room, id) => {
        roomsData[id] = room;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(roomsData));
      console.log('[MockFirebase] Saved rooms to storage:', this.rooms.size);
    } catch (error) {
      console.error('[MockFirebase] Error saving rooms to storage:', error);
    }
  }

  // Generate a 6-character room code
  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new room
  async createRoom(hostName: string): Promise<string> {
    const roomId = this.generateRoomCode();
    const room: Room = {
      id: roomId,
      host: hostName,
      participants: [hostName],
      signals: {},
      createdAt: Date.now()
    };
    this.rooms.set(roomId, room);
    this.saveRoomsToStorage(); // Persist to localStorage
    this.notifyListeners(`rooms/${roomId}`, room);
    console.log('[MockFirebase] Created room:', roomId);
    return roomId;
  }

  // Join an existing room
  async joinRoom(roomId: string, participantName: string): Promise<boolean> {
    console.log('[MockFirebase] Attempting to join room:', roomId, 'as', participantName);
    const room = this.rooms.get(roomId);
    if (!room) {
      console.error('[MockFirebase] Room not found:', roomId);
      console.log('[MockFirebase] Available rooms:', Array.from(this.rooms.keys()));
      return false;
    }
    
    if (!room.participants.includes(participantName)) {
      room.participants.push(participantName);
      this.saveRoomsToStorage(); // Persist to localStorage
    }
    
    this.notifyListeners(`rooms/${roomId}`, room);
    console.log('[MockFirebase] Successfully joined room:', roomId);
    return true;
  }

  // Get room data
  async getRoom(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) || null;
  }

  // Get mobile join URL
  getMobileJoinUrl(roomId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/conference-mobile?room=${roomId}`;
  }

  // Listen to room updates (adapter for real Firebase compatibility)
  onRoomUpdate(roomId: string, callback: (data: any) => void): (() => void) {
    // Convert onSnapshot to onRoomUpdate format
    return this.onSnapshot(`rooms/${roomId}`, (data: any) => {
      callback(data);
    });
  }

  // Listen for signals (adapter for real Firebase compatibility)
  onSignal(roomId: string, myPeerId: string, callback: (data: any) => void): (() => void) {
    // Listen for signals meant for this peer
    return this.onSnapshot(
      `rooms/${roomId}/signals`,
      (signals: any[]) => {
        if (signals) {
          signals.forEach(signal => {
            if (signal.to === myPeerId) {
              callback({
                from: signal.from,
                signal: signal.signal
              });
            }
          });
        }
      }
    );
  }

  // Send WebRTC signal
  async sendSignal(roomId: string, from: string, to: string, signal: any): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const signalKey = `${from}_to_${to}`;
    room.signals[signalKey] = signal;
    this.saveRoomsToStorage(); // Persist to localStorage
    this.notifyListeners(`rooms/${roomId}/signals/${signalKey}`, room.signals[signalKey]);
  }

  // Listen for changes
  onSnapshot(path: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    
    this.listeners.get(path)!.add(callback);

    // Immediately call with current data if available
    if (path.startsWith('rooms/')) {
      const parts = path.split('/');
      const roomId = parts[1];
      const room = this.rooms.get(roomId);
      
      if (room) {
        if (parts.length === 2) {
          callback(room);
        } else if (parts[2] === 'participants') {
          callback(room.participants);
        } else if (parts[2] === 'signals' && parts[3]) {
          const signalKey = parts[3];
          callback(room.signals[signalKey]);
        }
      }
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(path);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  // Notify all listeners for a path
  private notifyListeners(path: string, data: any): void {
    const listeners = this.listeners.get(path);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Clean up old rooms (called periodically)
  cleanupOldRooms(): void {
    let removedCount = 0;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.createdAt < oneHourAgo) {
        this.rooms.delete(roomId);
        this.saveRoomsToStorage(); // Persist to localStorage
        removedCount++;
      }
    }
    console.log(`[MockFirebase] Cleaned up ${removedCount} old rooms`);
  }

  // Update participant data (for tracking data)
  async updateParticipant(roomId: string, participantId: string, data: any): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    // Convert participants to object format if it's still an array
    if (Array.isArray(room.participants)) {
      const participantNames = room.participants;
      room.participants = {};
      // Preserve existing participant names
      participantNames.forEach(name => {
        (room.participants as { [key: string]: any })[name] = { name };
      });
    }
    
    const participantsObj = room.participants as { [key: string]: any };
    participantsObj[participantId] = {
      ...participantsObj[participantId],
      ...data,
      timestamp: new Date().toISOString()
    };
    
    this.saveRoomsToStorage();
    console.log(`[MockFirebase] Updated participant ${participantId} in room ${roomId}:`, data);
  }
}

// Create singleton instance
export const mockFirebaseConference = new MockFirebaseConference();

// Clean up old rooms every 5 minutes
setInterval(() => {
  mockFirebaseConference.cleanupOldRooms();
}, 5 * 60 * 1000);
