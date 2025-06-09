export interface ArchetypeData {
  icon: string;
  response: string;
  fullMessage: string;
  quote: string;
  tags: string[];
  backgroundImage?: string; // Optional DALL-E generated background URL
  backgroundType?: string; // Type of background (dalle, gemini, contextual-color, etc.)
  styleIndex?: number;
  styleName?: string;
  isHinderingEntry?: boolean; // Indicates if this was a hindering entry requiring extra care
}

export interface GenerateRequest {
  userInput: string;
  archetype: string;
}

export interface GenerateResponse {
  success: boolean;
  data?: ArchetypeData;
  error?: string;
}

export interface RegenerateBackgroundRequest {
  userInput: string;
  archetype: string;
  response: string;
  quote: string;
  currentStyleIndex?: number;
}

export interface RegenerateBackgroundResponse {
  success: boolean;
  data?: {
    backgroundImage: string | null;
    styleIndex: number;
    styleName: string;
  };
  error?: string;
}

export interface Archetype {
  name: string;
  icon: string;
  description: string;
  personality: string;
  responseStyle: string;
  promptTemplate: string;
} 