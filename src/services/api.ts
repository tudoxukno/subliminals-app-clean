// Use the same IP address that Expo is running on for network connectivity
const API_BASE_URL = 'http://192.168.1.35:3000';

export interface GenerateRequest {
  userInput: string;
  archetype: string;
}

export interface ArchetypeData {
  icon: string;
  response: string;
  fullMessage: string;
  quote: string;
  tags: string[];
  backgroundImage?: string;
  isHinderingEntry?: boolean;
}

export interface GenerateResponse {
  success: boolean;
  data?: ArchetypeData;
  error?: string;
}

export interface BackgroundGenerateRequest {
  userInput: string;
  archetype: string;
  response: string;
  quote: string;
  styleIndex?: number;
}

export interface BackgroundGenerateResponse {
  success: boolean;
  data?: {
    backgroundImage: string | null;
    styleIndex: number;
    styleName: string;
  };
  error?: string;
}

// Fast text-only generation (no background images)
export const generateSubliminalContentFast = async (
  userInput: string,
  archetype: string
): Promise<string> => {
  try {
    console.log('⚡ Making fast API request to:', `${API_BASE_URL}/generate-fast`);
    console.log('Request data:', { userInput, archetype });
    
    const response = await fetch(`${API_BASE_URL}/generate-fast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: userInput.trim(),
        archetype,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data: GenerateResponse = await response.json();
    console.log('Response data:', data);
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response from server');
    }

    // Return the full response as a JSON string for parsing by the frontend
    return JSON.stringify(data.data);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw new Error('Could not connect to the server');
  }
};

// Generate background image separately
export const generateBackgroundImage = async (
  userInput: string,
  archetype: string,
  response: string,
  quote: string,
  styleIndex?: number
): Promise<{ backgroundImage: string | null; styleIndex: number; styleName: string }> => {
  try {
    console.log('🎨 Making background API request to:', `${API_BASE_URL}/generate-background`);
    console.log('Request data:', { userInput, archetype, response, quote, styleIndex });
    
    const apiResponse = await fetch(`${API_BASE_URL}/generate-background`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: userInput.trim(),
        archetype,
        response,
        quote,
        styleIndex,
      }),
    });

    console.log('Background response status:', apiResponse.status);

    if (!apiResponse.ok) {
      throw new Error(`Server error: ${apiResponse.status}`);
    }

    const data: BackgroundGenerateResponse = await apiResponse.json();
    console.log('Background response data:', data);
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response from server');
    }

    return data.data;
  } catch (error) {
    console.error('Background API Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    // Return null background on error, don't fail the whole request
    return { backgroundImage: null, styleIndex: 0, styleName: 'Default' };
  }
};

// Original function (now with background images) - kept for compatibility
export const generateSubliminalContent = async (
  userInput: string,
  archetype: string
): Promise<string> => {
  try {
    console.log('Making API request to:', `${API_BASE_URL}/generate`);
    console.log('Request data:', { userInput, archetype });
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInput: userInput.trim(),
        archetype,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data: GenerateResponse = await response.json();
    console.log('Response data:', data);
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response from server');
    }

    // Return the full response as a JSON string for parsing by the frontend
    return JSON.stringify(data.data);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw new Error('Could not connect to the server');
  }
}; 