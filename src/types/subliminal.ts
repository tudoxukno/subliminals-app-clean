export type SavedSubliminal = {
  id: string;
  userInput: string;
  selectedArchetype: string;
  archetypeData: {
    icon: string;
    response: string;
    fullMessage: string;
    quote: string;
    tags: string[];
    backgroundImage?: string; // AI-generated background URL
  };
  dateSaved: string; // ISO string
};

export type SavedSubliminalWithDisplayDate = SavedSubliminal & {
  displayDate: string; // Formatted date like "Apr 26"
}; 