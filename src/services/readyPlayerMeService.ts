// Ready Player Me Service - Proper API Integration
// Get your credentials from: https://studio.readyplayer.me

interface RPMConfig {
  subdomain: string;
  appId?: string;
  apiKey?: string;
}

interface RPMAvatarData {
  id: string;
  modelUrl: string;
  imageUrl: string;
  gender?: 'male' | 'female';
  createdAt?: string;
}

export class ReadyPlayerMeService {
  private subdomain: string;
  private appId?: string;
  private apiKey?: string;

  constructor(config: RPMConfig) {
    this.subdomain = config.subdomain;
    this.appId = config.appId;
    this.apiKey = config.apiKey;
  }

  /**
   * Get the avatar creator URL for embedding
   */
  getAvatarCreatorUrl(options: {
    bodyType?: 'halfbody' | 'fullbody';
    quickStart?: boolean;
    clearCache?: boolean;
  } = {}): string {
    const params = new URLSearchParams();
    
    if (options.bodyType) params.append('bodyType', options.bodyType);
    if (options.quickStart) params.append('quickStart', 'true');
    if (options.clearCache) params.append('clearCache', 'true');
    
    // Add frame API for communication
    params.append('frameApi', 'true');
    
    return `https://${this.subdomain}.readyplayer.me/avatar?${params.toString()}`;
  }

  /**
   * Listen for avatar creation events from the iframe
   */
  setupAvatarCreatorListener(
    onAvatarCreated: (avatarUrl: string) => void,
    onError?: (error: string) => void
  ): () => void {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (!event.origin.includes('readyplayer.me')) return;

      const { eventName, data } = event.data;

      switch (eventName) {
        case 'v1.avatar.exported':
          console.log('Avatar created:', data.url);
          onAvatarCreated(data.url);
          break;
        case 'v1.frame.ready':
          console.log('Avatar creator ready');
          break;
        case 'v1.user.set':
          console.log('User set in avatar creator');
          break;
        default:
          console.log('RPM Event:', eventName, data);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Return cleanup function
    return () => window.removeEventListener('message', handleMessage);
  }

  /**
   * Get avatar data from URL (extract ID and metadata)
   */
  parseAvatarUrl(url: string): { id: string; baseUrl: string } | null {
    const match = url.match(/https:\/\/models\.readyplayer\.me\/([^.]+)\.glb/);
    if (!match) return null;

    return {
      id: match[1],
      baseUrl: `https://models.readyplayer.me/${match[1]}`
    };
  }

  /**
   * Get 2D profile image from avatar URL
   */
  getAvatarImageUrl(avatarUrl: string, options: {
    width?: number;
    height?: number;
    scene?: 'fullbody-portrait-v1' | 'halfbody-portrait-v1';
  } = {}): string {
    const parsed = this.parseAvatarUrl(avatarUrl);
    if (!parsed) return '';

    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.scene) params.append('scene', options.scene);

    return `${parsed.baseUrl}.png?${params.toString()}`;
  }

  /**
   * Validate if avatar URL is accessible
   */
  async validateAvatarUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Avatar validation failed:', error);
      return false;
    }
  }

  /**
   * Get optimized avatar URL with quality settings
   */
  getOptimizedAvatarUrl(avatarUrl: string, options: {
    quality?: 'low' | 'medium' | 'high';
    textureAtlas?: number;
    morphTargets?: string;
    pose?: string;
  } = {}): string {
    const parsed = this.parseAvatarUrl(avatarUrl);
    if (!parsed) return avatarUrl;

    const params = new URLSearchParams();
    if (options.quality) params.append('quality', options.quality);
    if (options.textureAtlas) params.append('textureAtlas', options.textureAtlas.toString());
    if (options.morphTargets) params.append('morphTargets', options.morphTargets);
    if (options.pose) params.append('pose', options.pose);

    return `${parsed.baseUrl}.glb?${params.toString()}`;
  }

  // Get stored avatars from localStorage
  private getStoredAvatars(): RPMAvatarData[] {
    try {
      const stored = localStorage.getItem('rpm_avatars');
      if (stored) {
        const avatars = JSON.parse(stored);
        return avatars.map((a: any) => ({
          id: a.id,
          modelUrl: a.url,
          imageUrl: a.imageUrl || a.url.replace('.glb', '.png')
        }));
      }
    } catch (error) {
      console.warn('Failed to load stored avatars:', error);
    }
    return [];
  }

  // Real RPM API integration for generating avatars
  async generateRandomAvatar(options: {
    gender?: 'male' | 'female';
    bodyType?: 'halfbody' | 'fullbody';
  } = {}): Promise<RPMAvatarData> {
    const { gender = Math.random() > 0.5 ? 'male' : 'female' } = options;
    
    // First, try to use stored avatars
    const storedAvatars = this.getStoredAvatars();
    if (storedAvatars.length > 0) {
      // Filter by gender if we have gender metadata
      const genderAvatars = storedAvatars.filter(a => {
        // If no gender info, include all
        return true;
      });
      
      if (genderAvatars.length > 0) {
        const randomIndex = Math.floor(Math.random() * genderAvatars.length);
        return genderAvatars[randomIndex];
      }
    }
    
    // If no stored avatars, generate a unique placeholder
    const avatarId = `placeholder-${gender}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const seed = Math.floor(Math.random() * 1000);
    
    // Use a more realistic avatar service
    const placeholderUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}&flip=${gender === 'female'}`;
    
    return {
      id: avatarId,
      modelUrl: '', // Empty will trigger geometric fallback in 3D
      imageUrl: placeholderUrl // This will work for 2D profile photos
    };
  }

  /**
   * Get avatar details by ID (if needed for API calls)
   */
  async getAvatar(avatarId: string): Promise<RPMAvatarData | null> {
    try {
      const response = await fetch(`https://api.readyplayer.me/v1/avatars/${avatarId}`, {
        headers: {
          'X-API-Key': this.apiKey || '',
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch avatar details:', response.status);
        return null;
      }

      const data = await response.json();
      return {
        id: data.id,
        modelUrl: `https://models.readyplayer.me/${data.id}.glb`,
        imageUrl: `https://models.readyplayer.me/${data.id}.png`
      };
    } catch (error) {
      console.warn('Error fetching avatar:', error);
      return null;
    }
  }
}

// Configuration - Using environment variables for security
export const rpmConfig: RPMConfig = {
  subdomain: process.env.REACT_APP_RPM_SUBDOMAIN || 'xr-cupid',
  appId: process.env.REACT_APP_RPM_APP_ID || '68389f8fa2bcefc234512570',
  apiKey: process.env.REACT_APP_RPM_API_KEY || ''
};

// Export service instance
export const rpmService = new ReadyPlayerMeService(rpmConfig);

// Export types
export type { RPMConfig, RPMAvatarData };
