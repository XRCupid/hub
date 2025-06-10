// This ensures the conference demo runs smoothly without real Firebase

interface Room {
  id: string;
  host: string;
  participants: string[];
  signals: { [key: string]: any };
  createdAt: number;
}

class MockFirebaseConference {
  private rooms: Map<string, Room> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

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
    this.notifyListeners(`rooms/${roomId}`, room);
    return roomId;
  }

  // Join an existing room
  async joinRoom(roomId: string, participantName: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }
    
    if (!room.participants.includes(participantName)) {
      room.participants.push(participantName);
    }
    
    this.notifyListeners(`rooms/${roomId}`, room);
    this.notifyListeners(`rooms/${roomId}/participants`, room.participants);
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
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.createdAt < oneHourAgo) {
        this.rooms.delete(roomId);
      }
    }
  }
}

// Create singleton instance
export const mockFirebaseConference = new MockFirebaseConference();

// Clean up old rooms every 5 minutes
setInterval(() => {
  mockFirebaseConference.cleanupOldRooms();
}, 5 * 60 * 1000);
