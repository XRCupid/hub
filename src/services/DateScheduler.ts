import { DateSchedule, DatingProfile, TextConversation } from '../types/DatingTypes';
import { NPCPersonalities } from '../config/NPCPersonalities';

interface ScheduleOptions {
  profileId: string;
  suggestedTime?: Date;
  venue?: string;
  activity?: string;
}

interface DateSuggestion {
  venue: string;
  activity: string;
  time: Date;
  reason: string;
}

export class DateScheduler {
  private scheduledDates: Map<string, DateSchedule> = new Map();

  scheduleDate(
    profile: DatingProfile,
    conversation: TextConversation,
    options: ScheduleOptions
  ): DateSchedule {
    const dateId = `date-${Date.now()}`;
    const suggestion = this.generateDateSuggestion(profile, conversation);
    
    const schedule: DateSchedule = {
      id: dateId,
      profileId: profile.id,
      dateTime: options.suggestedTime || suggestion.time,
      location: options.venue || suggestion.venue,
      locationType: this.getLocationType(options.venue || suggestion.venue),
      confirmed: false,
      preparationTips: this.generatePreparationTips(profile, suggestion)
    };

    this.scheduledDates.set(dateId, schedule);
    return schedule;
  }

  private generateDateSuggestion(
    profile: DatingProfile,
    conversation: TextConversation
  ): DateSuggestion {
    const suggestions: DateSuggestion[] = [];
    const baseTime = new Date();
    baseTime.setDate(baseTime.getDate() + 2); // Default to 2 days from now
    baseTime.setHours(19, 0, 0, 0); // 7 PM

    // Generate suggestions based on personality and interests
    switch (profile.personality) {
      case 'confident':
        suggestions.push({
          venue: 'Rooftop Bar',
          activity: 'Cocktails with a view',
          time: new Date(baseTime),
          reason: 'Perfect for confident conversation and impressive atmosphere'
        });
        suggestions.push({
          venue: 'Upscale Restaurant',
          activity: 'Wine tasting dinner',
          time: new Date(baseTime),
          reason: 'Sophisticated setting that matches their energy'
        });
        break;

      case 'shy':
        suggestions.push({
          venue: 'Cozy Coffee Shop',
          activity: 'Coffee and conversation',
          time: new Date(baseTime.setHours(14, 0, 0, 0)), // 2 PM
          reason: 'Low-pressure environment for comfortable conversation'
        });
        suggestions.push({
          venue: 'Bookstore Café',
          activity: 'Browse books and chat',
          time: new Date(baseTime.setHours(15, 0, 0, 0)), // 3 PM
          reason: 'Quiet setting with built-in conversation topics'
        });
        break;

      case 'adventurous':
        suggestions.push({
          venue: 'Rock Climbing Gym',
          activity: 'Indoor climbing session',
          time: new Date(baseTime.setHours(18, 0, 0, 0)), // 6 PM
          reason: 'Active date that matches their adventurous spirit'
        });
        suggestions.push({
          venue: 'Food Truck Festival',
          activity: 'Food adventure and live music',
          time: new Date(baseTime.setHours(17, 0, 0, 0)), // 5 PM
          reason: 'Spontaneous and fun with lots to explore'
        });
        break;

      case 'intellectual':
        suggestions.push({
          venue: 'Art Museum',
          activity: 'Gallery tour and discussion',
          time: new Date(baseTime.setHours(14, 0, 0, 0)), // 2 PM
          reason: 'Stimulating environment for deep conversation'
        });
        suggestions.push({
          venue: 'Science Museum',
          activity: 'Interactive exhibits',
          time: new Date(baseTime.setHours(13, 0, 0, 0)), // 1 PM
          reason: 'Educational and engaging for curious minds'
        });
        break;

      case 'charming':
        suggestions.push({
          venue: 'Jazz Club',
          activity: 'Live music and drinks',
          time: new Date(baseTime.setHours(20, 0, 0, 0)), // 8 PM
          reason: 'Sophisticated and romantic atmosphere'
        });
        suggestions.push({
          venue: 'Wine Bar',
          activity: 'Wine flight and small plates',
          time: new Date(baseTime),
          reason: 'Intimate setting for charming conversation'
        });
        break;
    }

    // Add interest-based suggestions
    if (profile.interests.includes('Hiking')) {
      suggestions.push({
        venue: 'Sunset Trail',
        activity: 'Sunset hike',
        time: new Date(baseTime.setHours(17, 0, 0, 0)),
        reason: 'Combines their love of hiking with romantic sunset views'
      });
    }

    if (profile.interests.includes('Cooking')) {
      suggestions.push({
        venue: 'Cooking Class Studio',
        activity: 'Couples cooking class',
        time: new Date(baseTime.setHours(18, 0, 0, 0)),
        reason: 'Interactive and fun, perfect for food lovers'
      });
    }

    // Return a random suggestion from the generated options
    return suggestions[Math.floor(Math.random() * suggestions.length)] || {
      venue: 'Nice Restaurant',
      activity: 'Dinner date',
      time: baseTime,
      reason: 'Classic first date option'
    };
  }

  private getLocationType(location: string): 'restaurant' | 'coffee' | 'activity' | 'bar' | 'park' {
    const locationLower = location.toLowerCase();
    if (locationLower.includes('restaurant') || locationLower.includes('dining')) return 'restaurant';
    if (locationLower.includes('coffee') || locationLower.includes('cafe')) return 'coffee';
    if (locationLower.includes('bar') || locationLower.includes('drinks')) return 'bar';
    if (locationLower.includes('park') || locationLower.includes('outdoor')) return 'park';
    return 'activity';
  }

  private generatePreparationTips(profile: DatingProfile, suggestion: DateSuggestion): string[] {
    const tips: string[] = [];

    // General tips
    tips.push("Arrive 5-10 minutes early to show respect for their time");
    tips.push("Put your phone away and give them your full attention");
    tips.push("Ask open-ended questions to keep conversation flowing");

    // Personality-specific tips
    switch (profile.personality) {
      case 'confident':
        tips.push("Match their energy but don't try to compete");
        tips.push("Show genuine interest in their achievements");
        tips.push("Be direct and honest - they'll appreciate it");
        break;
      case 'shy':
        tips.push("Be patient and give them time to open up");
        tips.push("Share about yourself to help them feel comfortable");
        tips.push("Choose quieter moments for deeper questions");
        break;
      case 'adventurous':
        tips.push("Be open to spontaneous changes in plans");
        tips.push("Share your own adventure stories");
        tips.push("Suggest a fun follow-up activity if things go well");
        break;
      case 'intellectual':
        tips.push("Come prepared with interesting topics to discuss");
        tips.push("Don't be afraid to admit when you don't know something");
        tips.push("Show genuine curiosity about their interests");
        break;
      case 'charming':
        tips.push("Appreciate their charm but look for depth too");
        tips.push("Use humor to build connection");
        tips.push("Be yourself - authenticity is attractive");
        break;
    }

    // Venue-specific tips
    if (suggestion.venue.includes('Restaurant') || suggestion.venue.includes('Bar')) {
      tips.push("Offer to split the bill or clarify who's paying beforehand");
    }
    if (suggestion.activity.includes('Active') || suggestion.activity.includes('Hiking')) {
      tips.push("Dress appropriately for the activity");
      tips.push("Bring water and be prepared for physical activity");
    }

    return tips;
  }

  confirmDate(dateId: string): DateSchedule | null {
    const date = this.scheduledDates.get(dateId);
    if (date) {
      date.confirmed = true;
      return date;
    }
    return null;
  }

  cancelDate(dateId: string, reason?: string): DateSchedule | null {
    const date = this.scheduledDates.get(dateId);
    if (date) {
      this.scheduledDates.delete(dateId);
      return date;
    }
    return null;
  }

  rescheduleDate(dateId: string, newTime: Date): DateSchedule | null {
    const date = this.scheduledDates.get(dateId);
    if (date) {
      date.dateTime = newTime;
      return date;
    }
    return null;
  }

  getUpcomingDates(): DateSchedule[] {
    const now = new Date();
    return Array.from(this.scheduledDates.values())
      .filter(date => 
        date.dateTime > now && 
        date.confirmed
      )
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }

  sendReminder(dateId: string): boolean {
    const date = this.scheduledDates.get(dateId);
    if (date) {
      // In a real app, this would send a notification
      console.log(`Reminder sent for date ${dateId}`);
      return true;
    }
    return false;
  }

  // Connect to NPC personality for simulation
  prepareNPCForDate(profileId: string): any {
    // Map dating profile to NPC personality
    const npcMapping: Record<string, string> = {
      'confident': 'confident-sarah',
      'shy': 'shy-emma',
      'adventurous': 'adventurous-alex',
      'intellectual': 'intellectual-maya',
      'charming': 'charming-james'
    };

    const profile = this.getProfileById(profileId);
    if (profile) {
      const npcId = npcMapping[profile.personality] || 'confident-sarah';
      return NPCPersonalities[npcId];
    }

    return NPCPersonalities['confident-sarah']; // Default
  }

  private getProfileById(profileId: string): DatingProfile | null {
    // This would be connected to your profile storage
    // For now, returning null as placeholder
    return null;
  }
}

export const dateScheduler = new DateScheduler();
