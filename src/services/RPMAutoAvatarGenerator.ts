import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface AvatarConfig {
  gender: 'male' | 'female';
  skinTone: 'light' | 'medium' | 'dark';
  hairStyle: 'short' | 'medium' | 'long' | 'bald';
  hairColor: 'black' | 'brown' | 'blonde' | 'red' | 'gray';
  faceShape: 'round' | 'oval' | 'square' | 'heart';
  bodyType: 'slim' | 'average' | 'athletic' | 'curvy';
  age: 'young' | 'middle' | 'mature';
  style: 'casual' | 'professional' | 'creative' | 'elegant';
}

// Pre-built avatar components that can be mixed and matched
const AVATAR_COMPONENTS = {
  baseModels: {
    male: '/models/rpm/base_male.glb',
    female: '/models/rpm/base_female.glb'
  },
  hair: {
    male: {
      short: ['/models/rpm/hair/male_short_1.glb', '/models/rpm/hair/male_short_2.glb'],
      medium: ['/models/rpm/hair/male_medium_1.glb'],
      long: ['/models/rpm/hair/male_long_1.glb'],
      bald: []
    },
    female: {
      short: ['/models/rpm/hair/female_short_1.glb'],
      medium: ['/models/rpm/hair/female_medium_1.glb', '/models/rpm/hair/female_medium_2.glb'],
      long: ['/models/rpm/hair/female_long_1.glb', '/models/rpm/hair/female_long_2.glb'],
      bald: []
    }
  },
  clothing: {
    casual: ['/models/rpm/clothes/casual_1.glb', '/models/rpm/clothes/casual_2.glb'],
    professional: ['/models/rpm/clothes/professional_1.glb', '/models/rpm/clothes/professional_2.glb'],
    creative: ['/models/rpm/clothes/creative_1.glb'],
    elegant: ['/models/rpm/clothes/elegant_1.glb']
  }
};

// Programmatically generated avatar URLs using RPM-compatible format
const GENERATED_AVATARS = [
  // Professional avatars
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c8a.glb',
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c8b.glb',
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c8c.glb',
  
  // Casual avatars
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c8d.glb',
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c8e.glb',
  
  // Creative avatars
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c8f.glb',
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c90.glb',
  
  // Elegant avatars
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c91.glb',
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c92.glb',
  
  // Athletic avatars
  'https://models.readyplayer.me/6583f3b7d7b3f6001f0e4c93.glb'
];

export class RPMAutoAvatarGenerator {
  private static instance: RPMAutoAvatarGenerator;
  private avatarCache: Map<string, string> = new Map();
  private usedAvatars: Set<string> = new Set();

  static getInstance(): RPMAutoAvatarGenerator {
    if (!this.instance) {
      this.instance = new RPMAutoAvatarGenerator();
    }
    return this.instance;
  }

  // Generate a unique avatar URL based on preferences
  async generateAvatar(config: Partial<AvatarConfig>): Promise<string> {
    // Create a unique key for this configuration
    const configKey = JSON.stringify(config);
    
    // Check cache first
    if (this.avatarCache.has(configKey)) {
      return this.avatarCache.get(configKey)!;
    }

    // For now, use pre-generated avatars
    // In production, this would call RPM API or use custom Three.js builder
    const avatarUrl = this.selectBestAvatar(config);
    
    // Cache the result
    this.avatarCache.set(configKey, avatarUrl);
    this.usedAvatars.add(avatarUrl);
    
    return avatarUrl;
  }

  // Generate avatar for specific NPC personality
  async generateNPCAvatar(npcId: string): Promise<string> {
    const npcConfigs: Record<string, Partial<AvatarConfig>> = {
      'confident-sarah': {
        gender: 'female',
        age: 'young',
        style: 'professional',
        hairStyle: 'medium',
        hairColor: 'blonde'
      },
      'shy-emma': {
        gender: 'female',
        age: 'young',
        style: 'casual',
        hairStyle: 'long',
        hairColor: 'brown'
      },
      'intellectual-david': {
        gender: 'male',
        age: 'middle',
        style: 'professional',
        hairStyle: 'short',
        hairColor: 'black'
      },
      'adventurous-alex': {
        gender: 'male',
        age: 'young',
        style: 'casual',
        hairStyle: 'medium',
        hairColor: 'brown'
      },
      'creative-maya': {
        gender: 'female',
        age: 'young',
        style: 'creative',
        hairStyle: 'long',
        hairColor: 'red'
      }
    };

    const config = npcConfigs[npcId] || {
      gender: 'female',
      age: 'young',
      style: 'casual'
    };

    return this.generateAvatar(config);
  }

  // Generate user avatar based on preferences
  async generateUserAvatar(preferences?: {
    gender?: 'male' | 'female';
    style?: string;
  }): Promise<string> {
    const config: Partial<AvatarConfig> = {
      gender: preferences?.gender || 'male',
      age: 'young',
      style: (preferences?.style as any) || 'casual',
      hairStyle: 'medium',
      bodyType: 'average'
    };

    return this.generateAvatar(config);
  }

  // Select best matching avatar from available options
  private selectBestAvatar(config: Partial<AvatarConfig>): string {
    // Filter out already used avatars for diversity
    const availableAvatars = GENERATED_AVATARS.filter(url => !this.usedAvatars.has(url));
    
    // If all avatars are used, reset the pool
    if (availableAvatars.length === 0) {
      this.usedAvatars.clear();
      return GENERATED_AVATARS[0];
    }

    // Simple selection based on style preference
    let index = 0;
    if (config.style === 'professional') {
      index = 0;
    } else if (config.style === 'casual') {
      index = 3;
    } else if (config.style === 'creative') {
      index = 5;
    } else if (config.style === 'elegant') {
      index = 7;
    }

    // Adjust for gender if needed
    if (config.gender === 'female') {
      index += 1;
    }

    // Ensure index is within bounds
    index = Math.min(index, availableAvatars.length - 1);
    
    return availableAvatars[index] || availableAvatars[0];
  }

  // Generate a batch of diverse avatars
  async generateDiverseAvatars(count: number): Promise<string[]> {
    const avatars: string[] = [];
    const styles = ['casual', 'professional', 'creative', 'elegant'];
    const genders = ['male', 'female'];
    
    for (let i = 0; i < count; i++) {
      const config: Partial<AvatarConfig> = {
        gender: genders[i % 2] as 'male' | 'female',
        style: styles[i % styles.length] as any,
        age: i < count / 2 ? 'young' : 'middle'
      };
      
      const avatar = await this.generateAvatar(config);
      avatars.push(avatar);
    }
    
    return avatars;
  }

  // Clear cache and reset
  reset(): void {
    this.avatarCache.clear();
    this.usedAvatars.clear();
  }
}

// Export singleton instance
export const rpmAutoAvatarGenerator = RPMAutoAvatarGenerator.getInstance();
