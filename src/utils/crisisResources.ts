export interface CrisisResource {
  name: string;
  contact: string;
  type: 'call' | 'text' | 'email' | 'chat';
  url?: string;
  description?: string;
}

export interface RegionalCrisisResources {
  region: string;
  primary: CrisisResource;
  secondary?: CrisisResource;
  chat?: CrisisResource;
  additional?: CrisisResource[];
}

// Detect user region (can be enhanced later with actual geolocation)
export const detectRegion = (userLocation?: string): string => {
  // Default to US for now - can be enhanced with actual location detection
  if (!userLocation) return 'US';
  
  // Simple country code detection (can be enhanced)
  if (userLocation.includes('UK') || userLocation.includes('GB')) return 'UK';
  if (userLocation.includes('CA') || userLocation.includes('Canada')) return 'CA';
  if (userLocation.includes('AU') || userLocation.includes('Australia')) return 'AU';
  
  return 'US'; // Default fallback
};

// Get crisis resources based on region
export const getCrisisResourcesByRegion = (userLocation?: string): RegionalCrisisResources => {
  const region = detectRegion(userLocation);
  
  switch (region) {
    case 'US':
      return {
        region: 'United States',
        primary: {
          name: '988 Suicide & Crisis Lifeline',
          contact: '988',
          type: 'call',
          description: '24/7 free and confidential support'
        },
        secondary: {
          name: 'Crisis Text Line',
          contact: 'Text HOME to 741741',
          type: 'text',
          description: 'Free 24/7 crisis support via text'
        },
        chat: {
          name: 'Crisis Chat',
          contact: 'Chat online',
          type: 'chat',
          url: 'https://suicidepreventionlifeline.org/chat',
          description: 'Live chat with crisis counselors'
        }
      };
      
    case 'UK':
      return {
        region: 'United Kingdom',
        primary: {
          name: 'Samaritans',
          contact: '116 123',
          type: 'call',
          description: 'Free 24/7 emotional support'
        },
        secondary: {
          name: 'Samaritans Email',
          contact: 'jo@samaritans.org',
          type: 'email',
          description: 'Email support (response within 24 hours)'
        }
      };
      
    case 'CA':
      return {
        region: 'Canada',
        primary: {
          name: 'Talk Suicide Canada',
          contact: '1-833-456-4566',
          type: 'call',
          description: '24/7 bilingual crisis support'
        },
        secondary: {
          name: 'Crisis Text Line Canada',
          contact: 'Text TALK to 741741',
          type: 'text',
          description: 'Free 24/7 crisis support via text'
        }
      };
      
    case 'AU':
      return {
        region: 'Australia',
        primary: {
          name: 'Lifeline Australia',
          contact: '13 11 14',
          type: 'call',
          description: '24/7 crisis support and suicide prevention'
        },
        secondary: {
          name: 'Lifeline Text',
          contact: '0477 13 11 14',
          type: 'text',
          description: 'Crisis support via text (6pm-midnight AEST)'
        },
        chat: {
          name: 'Lifeline Crisis Chat',
          contact: 'Chat online',
          type: 'chat',
          url: 'https://www.lifeline.org.au/crisis-chat',
          description: 'Online crisis chat support'
        }
      };
      
    default:
      return {
        region: 'International',
        primary: {
          name: 'International Association for Suicide Prevention',
          contact: 'Find local resources',
          type: 'chat',
          url: 'https://www.iasp.info/resources/Crisis_Centres',
          description: 'Directory of crisis centers worldwide'
        }
      };
  }
};

// Crisis level detection types
export type CrisisLevel = 'normal' | 'hindering' | 'elevated' | 'crisis';

// Enhanced crisis level descriptions
export const getCrisisLevelInfo = (level: CrisisLevel) => {
  switch (level) {
    case 'normal':
      return { severity: 'low', description: 'Regular supportive content' };
    case 'hindering':
      return { severity: 'medium', description: 'Supportive content with resources' };
    case 'elevated':
      return { severity: 'high', description: 'Shortened response with enhanced support' };
    case 'crisis':
      return { severity: 'critical', description: 'Full crisis intervention required' };
  }
}; 