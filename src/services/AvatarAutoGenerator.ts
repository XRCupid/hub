// Automatic Avatar Generation System
// Generates RPM-style avatars based on user preferences without manual creation

interface AvatarPreferences {
  gender: 'male' | 'female' | 'non-binary';
  ageRange: '18-25' | '26-35' | '36-45' | '45+';
  ethnicity?: 'asian' | 'black' | 'caucasian' | 'hispanic' | 'middle-eastern' | 'mixed';
  style: 'casual' | 'professional' | 'athletic' | 'creative' | 'elegant';
  bodyType?: 'slim' | 'average' | 'athletic' | 'curvy';
}

interface GeneratedAvatar {
  id: string;
  url: string;
  metadata: AvatarPreferences;
  createdAt: Date;
}

// Pre-generated avatar templates (would be replaced with actual RPM API calls)
const AVATAR_TEMPLATES = {
  male: {
    casual: [''],  // Empty strings will trigger fallback avatars
    professional: [''],
    athletic: [''],
    creative: [''],
    elegant: ['']
  },
  female: {
    casual: [''],
    professional: [''],
    athletic: [''],
    creative: [''],
    elegant: ['']
  }
};

export class AvatarAutoGenerator {
  private static instance: AvatarAutoGenerator;
  private generatedAvatars: Map<string, GeneratedAvatar> = new Map();

  static getInstance(): AvatarAutoGenerator {
    if (!this.instance) {
      this.instance = new AvatarAutoGenerator();
    }
    return this.instance;
  }

  // Generate avatar based on preferences
  async generateAvatar(preferences: AvatarPreferences): Promise<GeneratedAvatar> {
    const avatarId = this.generateAvatarId(preferences);
    
    // Check if we already have this combination
    if (this.generatedAvatars.has(avatarId)) {
      return this.generatedAvatars.get(avatarId)!;
    }

    // For now, use template selection
    // In future, this could call RPM API programmatically
    const avatarUrl = this.selectAvatarFromTemplates(preferences);
    
    const generatedAvatar: GeneratedAvatar = {
      id: avatarId,
      url: avatarUrl,
      metadata: preferences,
      createdAt: new Date()
    };

    this.generatedAvatars.set(avatarId, generatedAvatar);
    this.saveToLocalStorage();

    return generatedAvatar;
  }

  // Generate multiple avatars for a dating pool
  async generateDatingPool(
    userPreferences: { preferredGender: string; count: number }
  ): Promise<GeneratedAvatar[]> {
    const avatars: GeneratedAvatar[] = [];
    const styles = ['casual', 'professional', 'athletic', 'creative', 'elegant'];
    const ageRanges = ['18-25', '26-35', '36-45'] as const;

    for (let i = 0; i < userPreferences.count; i++) {
      const preferences: AvatarPreferences = {
        gender: userPreferences.preferredGender as any,
        ageRange: ageRanges[i % ageRanges.length],
        style: styles[i % styles.length] as any,
      };

      const avatar = await this.generateAvatar(preferences);
      avatars.push(avatar);
    }

    return avatars;
  }

  // Get avatar for specific NPC personality
  async getAvatarForNPC(npcId: string): Promise<string> {
    // Return empty string to trigger procedural avatar generation
    // The procedural system will generate appropriate avatars based on NPC ID
    return '';
  }

  private selectAvatarFromTemplates(preferences: AvatarPreferences): string {
    const genderTemplates = AVATAR_TEMPLATES[preferences.gender === 'non-binary' ? 'male' : preferences.gender];
    const styleTemplates = genderTemplates[preferences.style] || genderTemplates.casual;
    
    // Select random from available templates
    const randomIndex = Math.floor(Math.random() * styleTemplates.length);
    return styleTemplates[randomIndex];
  }

  private generateAvatarId(preferences: AvatarPreferences): string {
    return `${preferences.gender}-${preferences.ageRange}-${preferences.style}-${Date.now()}`;
  }

  private saveToLocalStorage(): void {
    const avatarData = Array.from(this.generatedAvatars.entries());
    localStorage.setItem('xrcupid_generated_avatars', JSON.stringify(avatarData));
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('xrcupid_generated_avatars');
    if (stored) {
      const avatarData = JSON.parse(stored);
      this.generatedAvatars = new Map(avatarData);
    }
  }
}

// Export singleton instance
export const avatarGenerator = AvatarAutoGenerator.getInstance();
