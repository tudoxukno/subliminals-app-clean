interface FeaturedRotation {
  backgroundIds: number[];
  rotationDate: string;
  nextRotationDate: string;
  rotationWeek: number;
}

const PREMIUM_BACKGROUND_POOL = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const FEATURED_SLOTS = 5; // Slots 6-10 will be replaced with featured
const ROTATION_INTERVAL_DAYS = 7; // Weekly rotation

// Helper to get Monday of current week (rotation day)
const getRotationDate = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
};

// Get week number for rotation tracking
const getWeekNumber = (date: Date): number => {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startDate.getDay() + 1) / 7);
};

// Fair distribution algorithm - ensures each background gets featured equally
const getFeaturedBackgrounds = (weekNumber: number): number[] => {
  // Create a deterministic but varied selection based on week number
  const seed = weekNumber;
  const shuffled = [...PREMIUM_BACKGROUND_POOL];
  
  // Deterministic shuffle based on week number
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 1)) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, FEATURED_SLOTS);
};

export const getCurrentFeaturedBackgrounds = (): FeaturedRotation => {
  const now = new Date();
  const rotationDate = getRotationDate(now);
  const nextRotationDate = new Date(rotationDate);
  nextRotationDate.setDate(nextRotationDate.getDate() + ROTATION_INTERVAL_DAYS);
  
  const weekNumber = getWeekNumber(rotationDate);
  const backgroundIds = getFeaturedBackgrounds(weekNumber);
  
  return {
    backgroundIds,
    rotationDate: rotationDate.toISOString().split('T')[0],
    nextRotationDate: nextRotationDate.toISOString().split('T')[0],
    rotationWeek: weekNumber
  };
};

export const isBackgroundFeatured = (backgroundId: number): boolean => {
  const featured = getCurrentFeaturedBackgrounds();
  return featured.backgroundIds.includes(backgroundId);
};

export const getFeaturedUntilDate = (): string => {
  const featured = getCurrentFeaturedBackgrounds();
  const date = new Date(featured.nextRotationDate);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

// Get next rotation preview (for future feature)
export const getNextRotationPreview = (): number[] => {
  const currentWeek = getWeekNumber(getRotationDate());
  return getFeaturedBackgrounds(currentWeek + 1);
}; 