// Ready Player Me Avatar Utilities
// This file contains sample RPM avatar URLs and utilities for avatar generation

export interface RPMAvatarConfig {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: 'realistic' | 'cartoon';
  avatarUrl: string;
}

// Demo RPM Avatars - Using official Ready Player Me demo URLs
export const DEMO_RPM_AVATARS: RPMAvatarConfig[] = [
  {
    id: 'demo-male-1',
    name: 'Alex',
    gender: 'male',
    style: 'realistic',
    avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5d.glb' // Official RPM demo male
  },
  {
    id: 'demo-female-1', 
    name: 'Jordan',
    gender: 'female',
    style: 'realistic',
    avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5e.glb' // Official RPM demo female
  },
  {
    id: 'demo-female-2',
    name: 'Sam',
    gender: 'female',
    style: 'realistic',
    avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d5f.glb' // Official RPM demo female
  },
  {
    id: 'demo-male-2',
    name: 'River',
    gender: 'male',
    style: 'realistic',
    avatarUrl: 'https://models.readyplayer.me/6409c2e6d4bb6b0001b84d60.glb' // Official RPM demo male
  },
  {
    id: 'haseeb-avatar',
    name: 'Haseeb',
    gender: 'male',
    style: 'realistic',
    avatarUrl: '/avatars/Haseeb.glb' // Local custom avatar
  },
  {
    id: 'dougie-avatar',
    name: 'Dougie',
    gender: 'male',
    style: 'realistic',
    avatarUrl: '/avatars/Dougie.glb' // Local custom avatar
  }
];

// Instructions for getting real RPM avatars
export const RPM_SETUP_INSTRUCTIONS = `
🎭 HOW TO GET REAL RPM AVATARS:

1. CREATE AVATARS:
   • Visit https://readyplayer.me
   • Create free avatars for your NPCs
   • Copy the .glb URLs (e.g., https://models.readyplayer.me/your-avatar-id.glb)

2. UPDATE AVATAR URLS:
   • Replace empty URLs in DEMO_RPM_AVATARS with your real avatar URLs
   • Or use the RPMAvatarCreator component to let users input custom URLs

3. CURRENT STATUS:
   • Fallback geometric avatars are showing (blue 3D shapes with simple faces)
   • These demonstrate the 3D avatar positioning and emotion system
   • Replace URLs to see actual RPM avatars with realistic faces and bodies

4. WHERE TO SEE AVATARS:
   • Dating Simulation → Match with someone → Chat → Video Date
   • The 3D avatar appears in the video call interface
   • Emotions change based on conversation (via Hume AI)
`;

// RPM Avatar Generator Integration
export class RPMAvatarGenerator {
  private static readonly RPM_SUBDOMAIN = 'demo'; // Replace with your subdomain
  private static readonly RPM_API_BASE = 'https://api.readyplayer.me/v1';
  
  /**
   * Generate Avatar Creator URL for custom avatar creation
   * Users can create their own avatars using this URL
   */
  static getAvatarCreatorUrl(config?: {
    bodyType?: 'halfbody' | 'fullbody';
    quickStart?: boolean;
    clearCache?: boolean;
  }): string {
    const params = new URLSearchParams();
    
    if (config?.bodyType) params.set('bodyType', config.bodyType);
    if (config?.quickStart) params.set('quickStart', 'true');
    if (config?.clearCache) params.set('clearCache', 'true');
    
    const queryString = params.toString();
    const baseUrl = `https://${this.RPM_SUBDOMAIN}.readyplayer.me/avatar`;
    
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }
  
  /**
   * Validate if an avatar URL is properly formatted
   */
  static isValidAvatarUrl(url: string): boolean {
    const rpmUrlPattern = /^https:\/\/(models\.readyplayer\.me|d1a370nemizbjq\.cloudfront\.net)\/.+\.glb$/;
    return rpmUrlPattern.test(url);
  }
  
  /**
   * Get a random demo avatar for testing
   */
  static getRandomDemoAvatar(): RPMAvatarConfig {
    const avatars = DEMO_RPM_AVATARS;
    return avatars[Math.floor(Math.random() * avatars.length)];
  }
  
  /**
   * Get avatar by character name
   */
  static getAvatarByName(name: string): RPMAvatarConfig | null {
    return DEMO_RPM_AVATARS.find(avatar => 
      avatar.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  /**
   * Log setup instructions to console
   */
  static logSetupInstructions(): void {
    console.log(RPM_SETUP_INSTRUCTIONS);
  }
}

// Avatar URL validation and fallback
export const getValidAvatarUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  
  // If it's a valid RPM URL, return it
  if (RPMAvatarGenerator.isValidAvatarUrl(url)) {
    return url;
  }
  
  // Otherwise return undefined to use fallback
  return undefined;
};

export default {
  DEMO_RPM_AVATARS,
  RPMAvatarGenerator,
  getValidAvatarUrl,
  RPM_SETUP_INSTRUCTIONS
};
