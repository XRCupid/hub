// Avatar Generator - Creates diverse RPM avatars based on user preferences
import { RPMAvatarConfig } from './rpmAvatars';
import { rpmService } from '../services/readyPlayerMeService';
import { ReadyPlayerMeService } from '../services/readyPlayerMeService';

export type Gender = 'male' | 'female' | 'nonbinary';
export type PersonalityType = 'outgoing' | 'shy' | 'intellectual' | 'artistic' | 'adventurous' | 'romantic';
export type Ethnicity = 'asian' | 'black' | 'hispanic' | 'white' | 'mixed' | 'other';
export type BodyType = 'halfbody' | 'fullbody';
export type AvatarStyle = 'realistic' | 'cartoon' | 'stylized';
export type ConversationStyle = 'flirty' | 'intellectual' | 'casual' | 'romantic' | 'humorous';

export interface UserPreferences {
  interestedIn: Gender | 'all';
  ageRange: [number, number];
  styles: AvatarStyle[];
  ethnicities: string[];
  bodyTypes: BodyType[];
  personalityTypes: PersonalityType[];
}

export interface GeneratedProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  pronouns: string;
  ethnicity: string;
  bodyType: BodyType;
  personalityType: PersonalityType;
  bio: string;
  interests: string[];
  photos: string[];
  avatar: RPMAvatarConfig;
  conversationStyle: ConversationStyle;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Name pools for different genders and ethnicities
const NAME_POOLS = {
  male: {
    western: ['Alex', 'James', 'Michael', 'David', 'Chris', 'Ryan', 'Matt', 'Josh', 'Tyler', 'Brandon'],
    latino: ['Diego', 'Carlos', 'Miguel', 'Luis', 'Jose', 'Antonio', 'Rafael', 'Gabriel', 'Adrian', 'Fernando'],
    asian: ['Kai', 'Hiroshi', 'Jin', 'Ravi', 'Arjun', 'Wei', 'Takeshi', 'Kenji', 'Yuki', 'Satoshi'],
    african: ['Malik', 'Jamal', 'Kwame', 'Kofi', 'Amari', 'Zion', 'Jabari', 'Khari', 'Omari', 'Tariq'],
    middle_eastern: ['Omar', 'Hassan', 'Amir', 'Samir', 'Karim', 'Tariq', 'Yusuf', 'Rashid', 'Farid', 'Nabil']
  },
  female: {
    western: ['Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail'],
    latino: ['Sofia', 'Isabella', 'Camila', 'Valentina', 'Natalia', 'Gabriela', 'Lucia', 'Elena', 'Victoria', 'Adriana'],
    asian: ['Sakura', 'Yuki', 'Mei', 'Priya', 'Ananya', 'Li', 'Akiko', 'Hana', 'Suki', 'Rina'],
    african: ['Zara', 'Amara', 'Nia', 'Kaia', 'Zuri', 'Amina', 'Aaliyah', 'Imani', 'Sanaa', 'Kira'],
    middle_eastern: ['Layla', 'Amira', 'Yasmin', 'Nour', 'Zara', 'Leila', 'Fatima', 'Soraya', 'Dina', 'Rania']
  },
  nonbinary: {
    universal: ['River', 'Sage', 'Quinn', 'Rowan', 'Phoenix', 'Avery', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Blake', 'Cameron', 'Drew', 'Emery', 'Finley']
  }
};

// Personality-based bio templates
const BIO_TEMPLATES = {
  outgoing: [
    "Life's too short to stay inside! I love meeting new people and trying new adventures. Always up for spontaneous plans!",
    "Social butterfly who loves parties, concerts, and making new friends. Let's explore the city together!",
    "Extrovert who gets energy from being around people. I love hosting dinner parties and game nights!"
  ],
  shy: [
    "I'm a bit introverted but love deep conversations over coffee. Quality time means everything to me.",
    "Quiet soul who enjoys cozy nights in, good books, and meaningful connections. Slow and steady wins my heart.",
    "I may be shy at first, but I'm incredibly loyal and caring once you get to know me."
  ],
  intellectual: [
    "PhD student who loves discussing philosophy, science, and the mysteries of the universe. Sapiosexual vibes.",
    "Bookworm and podcast enthusiast. I find intelligence incredibly attractive. Let's debate ideas!",
    "Always learning something new. Currently reading about quantum physics and ancient history."
  ],
  artistic: [
    "Creative soul who paints, writes, and sees beauty in everyday moments. Art is my love language.",
    "Musician and visual artist. I believe creativity is the highest form of human expression.",
    "I express myself through art, music, and dance. Looking for someone who appreciates creativity."
  ],
  adventurous: [
    "Adrenaline junkie who loves hiking, rock climbing, and traveling to new places. Adventure awaits!",
    "Passport full of stamps and bucket list full of dreams. Let's explore the world together!",
    "Outdoor enthusiast who finds peace in nature. Camping, hiking, and stargazing are my therapy."
  ],
  romantic: [
    "Old soul who believes in handwritten letters, surprise dates, and true love. Romance isn't dead!",
    "I love candlelit dinners, sunset walks, and creating magical moments together.",
    "Hopeless romantic looking for my person. I believe in soulmates and fairy tale endings."
  ]
};

// Interest pools based on personality types
const INTEREST_POOLS = {
  outgoing: ['dancing', 'parties', 'networking', 'social media', 'concerts', 'festivals', 'sports events', 'meetups'],
  shy: ['reading', 'coffee shops', 'museums', 'quiet walks', 'home cooking', 'board games', 'documentaries', 'gardening'],
  intellectual: ['philosophy', 'science', 'podcasts', 'debates', 'research', 'lectures', 'chess', 'documentaries'],
  artistic: ['painting', 'music', 'theater', 'poetry', 'photography', 'design', 'crafts', 'galleries'],
  adventurous: ['hiking', 'travel', 'rock climbing', 'camping', 'skiing', 'surfing', 'backpacking', 'photography'],
  romantic: ['wine tasting', 'sunset walks', 'poetry', 'classical music', 'fine dining', 'dancing', 'flowers', 'stargazing']
};

export class AvatarGenerator {
  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private static generateName(gender: Gender, ethnicity?: string): string {
    if (gender === 'nonbinary') {
      return this.getRandomElement(NAME_POOLS.nonbinary.universal);
    }
    
    // Safety check for ethnicity
    if (!ethnicity) {
      ethnicity = 'western'; // Default fallback
    }
    
    const ethnicityKey = ethnicity.toLowerCase().replace(' ', '_') as keyof typeof NAME_POOLS.male;
    const namePool = NAME_POOLS[gender][ethnicityKey] || NAME_POOLS[gender].western;
    return this.getRandomElement(namePool);
  }

  private static generatePronouns(gender: Gender): string {
    switch (gender) {
      case 'male': return 'he/him';
      case 'female': return 'she/her';
      case 'nonbinary': 
        return this.getRandomElement(['they/them', 'she/they', 'he/they', 'xe/xir']);
      default: return 'they/them';
    }
  }

  private static generateBio(personalityType: PersonalityType, name: string, age: number): string {
    const templates = BIO_TEMPLATES[personalityType] || BIO_TEMPLATES.outgoing;
    const template = this.getRandomElement(templates);
    
    // Add age context for some bios
    const ageContext = age < 25 ? " Just starting my journey!" : 
                      age > 35 ? " Life experience has taught me what I want." : "";
    
    return template + ageContext;
  }

  private static generateInterests(personalityType: PersonalityType): string[] {
    const baseInterests = INTEREST_POOLS[personalityType] || INTEREST_POOLS.outgoing;
    const commonInterests = ['movies', 'music', 'food', 'travel', 'fitness', 'technology'];
    
    // Get 3-4 personality-based interests + 1-2 common interests
    const personalityInterests = this.getRandomElements(baseInterests, 3);
    const generalInterests = this.getRandomElements(commonInterests, 2);
    
    return [...personalityInterests, ...generalInterests];
  }

  /**
   * Generate avatar URL using RPM API
   * Uses the Ready Player Me service to create real 3D avatars
   */
  private static async generateAvatarUrl(gender: Gender, bodyType: 'halfbody' | 'fullbody' = 'halfbody'): Promise<string> {
    try {
      const rpmService = new ReadyPlayerMeService({
        subdomain: process.env.REACT_APP_RPM_SUBDOMAIN || 'xr-cupid',
        appId: process.env.REACT_APP_RPM_APP_ID,
        apiKey: process.env.REACT_APP_RPM_API_KEY
      });

      // Map nonbinary to random binary gender for RPM API
      const rpmGender = gender === 'nonbinary' 
        ? (Math.random() > 0.5 ? 'male' : 'female')
        : gender as 'male' | 'female';

      const avatarData = await rpmService.generateRandomAvatar({
        gender: rpmGender,
        bodyType
      });

      return avatarData.modelUrl;
    } catch (error) {
      console.warn('Failed to generate RPM avatar:', error);
      return ''; // Will trigger geometric fallback
    }
  }

  private static generatePhotos(avatarUrl: string): string[] {
    // Convert .glb avatar URL to .png photo URL
    const photoUrl = avatarUrl.replace('.glb', '.png');
    
    // Generate multiple photos by using different angles/poses
    // For now, we'll use the same photo multiple times
    // In production, RPM can generate different poses/angles
    return [
      photoUrl,
      photoUrl, // Could be different angle
      photoUrl  // Could be different pose
    ];
  }

  private static getConversationStyle(personalityType: PersonalityType): ConversationStyle {
    const styleMap: Record<string, ConversationStyle[]> = {
      outgoing: ['flirty', 'casual', 'humorous'],
      shy: ['romantic', 'casual'],
      intellectual: ['intellectual', 'casual'],
      artistic: ['romantic', 'intellectual'],
      adventurous: ['casual', 'flirty'],
      romantic: ['romantic', 'flirty']
    };
    
    const options = styleMap[personalityType] || ['casual'];
    return this.getRandomElement(options);
  }

  private static getDifficulty(personalityType: PersonalityType): 'easy' | 'medium' | 'hard' {
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      outgoing: 'easy',
      shy: 'medium',
      intellectual: 'hard',
      artistic: 'medium',
      adventurous: 'easy',
      romantic: 'medium'
    };
    
    return difficultyMap[personalityType] || 'medium';
  }

  /**
   * Generate a diverse set of dating profiles based on user preferences
   */
  static async generateProfiles(preferences: UserPreferences, count: number = 6): Promise<GeneratedProfile[]> {
    const profiles: GeneratedProfile[] = [];
    
    // Determine which genders to generate
    const gendersToGenerate: Gender[] = [];
    if (preferences.interestedIn === 'all') {
      gendersToGenerate.push('male', 'female', 'nonbinary');
    } else if (preferences.interestedIn === 'nonbinary') {
      gendersToGenerate.push('nonbinary');
    } else {
      // Map 'men'/'women' to 'male'/'female'
      const genderMap: Record<string, Gender> = {
        'men': 'male',
        'women': 'female',
        'male': 'male',
        'female': 'female'
      };
      const mappedGender = genderMap[preferences.interestedIn as string];
      if (mappedGender) {
        gendersToGenerate.push(mappedGender);
      }
    }

    for (let i = 0; i < count; i++) {
      const gender = this.getRandomElement(gendersToGenerate);
      const ethnicity = preferences.ethnicities.length > 0 
        ? this.getRandomElement(preferences.ethnicities)
        : 'western'; // Default fallback
      const bodyType = this.getRandomElement(preferences.bodyTypes);
      const personalityType = this.getRandomElement(preferences.personalityTypes);
      const style = this.getRandomElement(preferences.styles);
      
      const name = this.generateName(gender, ethnicity);
      const age = Math.floor(Math.random() * (preferences.ageRange[1] - preferences.ageRange[0] + 1)) + preferences.ageRange[0];
      
      const avatarUrl = await this.generateAvatarUrl(gender, bodyType);
      const photos = this.generatePhotos(avatarUrl);
      
      const profile: GeneratedProfile = {
        id: `generated-${i}-${Date.now()}`,
        name,
        age,
        gender,
        pronouns: this.generatePronouns(gender),
        ethnicity,
        bodyType,
        personalityType,
        bio: this.generateBio(personalityType, name, age),
        interests: this.generateInterests(personalityType),
        photos,
        avatar: {
          id: `avatar-${i}`,
          name,
          gender: gender === 'nonbinary' ? 'male' : gender, // RPM fallback
          style: style === 'stylized' ? 'realistic' : style, // RPM fallback
          avatarUrl
        },
        conversationStyle: this.getConversationStyle(personalityType),
        difficulty: this.getDifficulty(personalityType)
      };
      
      profiles.push(profile);
    }
    
    return profiles;
  }

  /**
   * Generate a single profile for quick testing
   */
  static async generateSingleProfile(gender?: Gender): Promise<GeneratedProfile> {
    const defaultPreferences: UserPreferences = {
      interestedIn: 'all',
      ageRange: [22, 35],
      styles: ['realistic', 'cartoon'],
      ethnicities: ['caucasian', 'hispanic', 'african', 'asian'],
      bodyTypes: ['halfbody', 'fullbody'],
      personalityTypes: ['outgoing', 'intellectual', 'artistic']
    };

    const profiles = await this.generateProfiles(defaultPreferences, 1);
    return profiles[0];
  }
}

export default AvatarGenerator;
