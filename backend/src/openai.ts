import OpenAI from 'openai';
import { ArchetypeData } from './types';
import { archetypes } from './archetypes';

// Initialize OpenAI client only if API key is available and valid
let openai: OpenAI | null = null;

// Use environment variable for API key
const apiKey = process.env.OPENAI_API_KEY;

const isValidApiKey = apiKey && 
                     apiKey.startsWith('sk-') && 
                     apiKey.length > 20;

if (isValidApiKey) {
  openai = new OpenAI({
    apiKey: apiKey,
  });
  console.log('✅ OpenAI client initialized successfully');
} else {
  console.log('❌ OpenAI client NOT initialized - using fallbacks');
}

// Archetype-specific visual styles for DALL-E prompts - Multiple aesthetic moods per archetype
const archetypeVisualStyles = {
  Mirror: [
    {
      name: "Rainy Window",
      style: "raindrops on glass, soft window light, intimate indoor perspective",
      colors: "muted blues, soft grays, warm amber light, gentle whites",
      mood: "contemplative, introspective, cozy",
      elements: "water droplets, blurred city lights, soft reflections, window frames",
      aesthetic: "moody photography, lo-fi vibes, introspective content"
    },
    {
      name: "Stilled Hands",
      style: "gentle hands in lap, soft natural lighting, peaceful moment",
      colors: "warm skin tones, cream whites, soft beiges, golden hour light",
      mood: "peaceful, self-aware, grounded",
      elements: "gentle gestures, soft shadows, natural textures, quiet moments",
      aesthetic: "portrait photography, mindful living, self-care content"
    },
    {
      name: "Indoor Plant Shadows",
      style: "houseplant shadows on walls, natural light patterns, home sanctuary",
      colors: "sage green, warm whites, soft terracotta, natural browns",
      mood: "nurturing, growth-focused, authentic",
      elements: "plant silhouettes, dappled light, organic shapes, home textures",
      aesthetic: "plant parent vibes, home aesthetic, growth mindset"
    },
    {
      name: "Linen Sheets",
      style: "rumpled linen bedding, morning light, soft textile textures",
      colors: "cream whites, soft beiges, warm ivory, gentle shadows",
      mood: "comfortable, honest, vulnerable",
      elements: "fabric folds, natural textures, soft lighting, intimate spaces",
      aesthetic: "bedroom aesthetic, comfort vibes, authentic living"
    },
    {
      name: "Aura Wash",
      style: "soft gradient washes, ethereal color bleeds, dreamy atmosphere",
      colors: "soft pastels, warm peach, lavender mist, golden undertones",
      mood: "ethereal, self-discovering, luminous",
      elements: "color gradients, soft edges, flowing forms, light diffusion",
      aesthetic: "digital art, aura photography, spiritual wellness"
    }
  ],
  Therapist: [
    {
      name: "Coffee Steam",
      style: "warm mug with rising steam, cozy cafe corner, intimate conversation space",
      colors: "warm browns, cream whites, soft oranges, golden light",
      mood: "comforting, safe, nurturing",
      elements: "steam wisps, ceramic textures, warm lighting, cozy corners",
      aesthetic: "cafe culture, comfort food, cozy lifestyle"
    },
    {
      name: "Soft Blanket Folds",
      style: "textured throw blankets, layered fabrics, nest-like comfort",
      colors: "warm grays, soft creams, muted earth tones, gentle shadows",
      mood: "embracing, protective, healing",
      elements: "fabric textures, soft folds, layered comfort, warm shadows",
      aesthetic: "hygge lifestyle, comfort aesthetic, self-care spaces"
    },
    {
      name: "Sunlit Floor",
      style: "warm sunlight streaming across wooden floors, peaceful interior",
      colors: "golden yellow, warm honey, soft browns, bright whites",
      mood: "hopeful, warming, grounding",
      elements: "light patterns, wood grain, gentle shadows, natural warmth",
      aesthetic: "home photography, natural light, peaceful living"
    },
    {
      name: "Journal Pages",
      style: "open notebook with handwritten words, personal reflection space",
      colors: "cream paper, soft blacks, warm browns, gentle blues",
      mood: "reflective, processing, therapeutic",
      elements: "paper textures, handwriting, pen marks, personal artifacts",
      aesthetic: "journaling community, self-reflection, mindful writing"
    },
    {
      name: "Potted Herbs",
      style: "small herb garden on windowsill, natural healing elements",
      colors: "fresh greens, terracotta browns, natural whites, soft light",
      mood: "healing, natural, nurturing",
      elements: "herb leaves, clay pots, natural light, growth patterns",
      aesthetic: "plant medicine, natural healing, kitchen garden vibes"
    }
  ],
  Realist: [
    {
      name: "City Block Dusk",
      style: "urban street at golden hour, real city life, grounded perspective",
      colors: "warm amber, deep blues, charcoal grays, golden light",
      mood: "grounded, authentic, determined",
      elements: "street lights, urban textures, real architecture, evening glow",
      aesthetic: "street photography, urban lifestyle, real life moments"
    },
    {
      name: "Textured Notebook",
      style: "well-used notebook with plans and lists, practical organization",
      colors: "cream paper, black ink, warm browns, subtle shadows",
      mood: "organized, purposeful, action-oriented",
      elements: "handwritten lists, paper texture, practical tools, real planning",
      aesthetic: "productivity culture, goal setting, practical planning"
    },
    {
      name: "Morning Coffee Ritual",
      style: "simple coffee setup, daily routine, no-nonsense morning",
      colors: "rich browns, warm whites, muted blacks, natural light",
      mood: "routine, grounded, practical",
      elements: "coffee equipment, morning light, simple tools, daily rituals",
      aesthetic: "morning routine, coffee culture, practical living"
    },
    {
      name: "Workspace Corner",
      style: "clean desk setup, organized tools, productive environment",
      colors: "neutral grays, warm whites, accent blues, natural light",
      mood: "focused, productive, clear",
      elements: "desk surfaces, organized tools, clean lines, work materials",
      aesthetic: "workspace design, productivity setup, professional life"
    },
    {
      name: "Concrete Steps",
      style: "urban concrete textures, architectural elements, solid foundations",
      colors: "concrete grays, warm shadows, subtle blues, natural light",
      mood: "solid, reliable, strong",
      elements: "concrete textures, architectural lines, urban materials, strong forms",
      aesthetic: "architectural photography, urban design, solid foundations"
    }
  ],
  Poet: [
    {
      name: "Golden Hour Curtains",
      style: "sheer curtains with warm light filtering through, dreamy atmosphere",
      colors: "golden yellow, soft whites, warm amber, gentle shadows",
      mood: "dreamy, romantic, transcendent",
      elements: "fabric movement, filtered light, soft shadows, ethereal glow",
      aesthetic: "dreamy photography, golden hour vibes, romantic lighting"
    },
    {
      name: "Vintage Book Pages",
      style: "old book pages with handwritten notes, literary atmosphere",
      colors: "aged cream, sepia browns, soft blacks, vintage tones",
      mood: "nostalgic, literary, soulful",
      elements: "paper textures, handwriting, book spines, vintage details",
      aesthetic: "dark academia, literary culture, vintage aesthetics"
    },
    {
      name: "Flower Petals Scattered",
      style: "delicate petals on surfaces, natural beauty, ephemeral moments",
      colors: "soft pinks, cream whites, gentle greens, natural light",
      mood: "delicate, beautiful, fleeting",
      elements: "flower petals, natural textures, soft surfaces, organic forms",
      aesthetic: "botanical photography, natural beauty, ephemeral art"
    },
    {
      name: "Candlelight Glow",
      style: "warm candle flames, intimate lighting, cozy evening atmosphere",
      colors: "warm oranges, deep shadows, golden light, soft blacks",
      mood: "intimate, mystical, warm",
      elements: "flame light, wax textures, warm glow, intimate shadows",
      aesthetic: "cozy evening, intimate lighting, mystical vibes"
    },
    {
      name: "Watercolor Bleeds",
      style: "soft watercolor washes, artistic color bleeds, creative expression",
      colors: "soft purples, gentle blues, warm pinks, flowing gradients",
      mood: "artistic, flowing, expressive",
      elements: "color bleeds, soft edges, artistic textures, creative flow",
      aesthetic: "watercolor art, creative expression, artistic vibes"
    }
  ],
  BestFriend: [
    {
      name: "Cozy Friend Hangout",
      style: "comfortable living room setup, soft blankets, warm lighting, friend space",
      colors: "warm terracotta, soft cream, golden hour light, cozy browns",
      mood: "comfortable, supportive, familiar",
      elements: "soft textures, warm lighting, cozy corners, friendly spaces",
      aesthetic: "cozy lifestyle, friend hangouts, warm homes"
    },
    {
      name: "Text Message Glow",
      style: "phone screen with warm message light, modern communication, friendly connection",
      colors: "soft blues, warm whites, gentle screen glow, evening tones",
      mood: "connected, supportive, modern",
      elements: "screen light, soft shadows, modern textures, connection vibes",
      aesthetic: "modern friendship, digital connection, supportive communication"
    },
    {
      name: "Shared Snacks",
      style: "casual snacks shared between friends, warm kitchen counter, comfort food",
      colors: "warm browns, golden tones, soft whites, comfort colors",
      mood: "nurturing, casual, friendly",
      elements: "food textures, casual spaces, sharing moments, comfort vibes",
      aesthetic: "comfort food, friend time, casual sharing"
    },
    {
      name: "Friendship Bracelet Colors",
      style: "colorful threads and warm textures, handmade friendship symbols",
      colors: "bright pastels, friendship rainbow, warm gold accents, playful tones",
      mood: "loyal, playful, meaningful",
      elements: "thread textures, colorful patterns, handmade details, friendship symbols",
      aesthetic: "friendship culture, handmade gifts, loyal connection"
    },
    {
      name: "Group Hug Energy",
      style: "warm embrace lighting, soft golden hour, supportive atmosphere",
      colors: "warm golds, soft peaches, comforting ambers, hug-like warmth",
      mood: "supportive, loving, protective",
      elements: "warm light, soft shadows, embracing atmosphere, protective vibes",
      aesthetic: "emotional support, warm hugs, unconditional love"
    }
  ]
};

// Generate DALL-E prompt based on archetype and content
const generateImagePrompt = (archetype: string, userInput: string, response: string, quote: string, styleIndex?: number): string => {
  const styles = archetypeVisualStyles[archetype as keyof typeof archetypeVisualStyles];
  
  if (!styles || !Array.isArray(styles)) {
    return "Simple abstract background, soft colors, minimalist design";
  }

  // Use provided styleIndex or randomly select a style
  const selectedStyleIndex = styleIndex !== undefined ? styleIndex % styles.length : Math.floor(Math.random() * styles.length);
  const style = styles[selectedStyleIndex];

  // Create very simple, safe prompts to avoid content policy issues
  const colorPalette = style.colors.split(',')[0]; // Just use the first color
  const simpleMood = style.mood.split(',')[0]; // Just use the first mood word
  
  // Ultra-simple prompt to avoid any policy violations
  return `Abstract background with ${colorPalette} colors. ${simpleMood} mood. Soft gradient. No text or people.`;
};

// Get a specific style for an archetype (for regeneration)
const getArchetypeStyle = (archetype: string, styleIndex: number) => {
  const styles = archetypeVisualStyles[archetype as keyof typeof archetypeVisualStyles];
  if (!styles || !Array.isArray(styles)) return null;
  return styles[styleIndex % styles.length];
};

// Extract emotional themes from content for more personalized images
const extractEmotionalThemes = (userInput: string, response: string, quote: string): string => {
  const content = `${userInput} ${response} ${quote}`.toLowerCase();
  
  const themeMap = {
    'invisible|unseen|hidden': 'visibility and recognition',
    'replay|repeat|stuck': 'cycles and transformation',
    'lost|confused|unclear': 'guidance and clarity',
    'tired|exhausted|drained': 'renewal and energy',
    'broken|hurt|pain': 'healing and wholeness',
    'fear|scared|afraid': 'courage and strength',
    'alone|lonely|isolated': 'connection and belonging',
    'hope|dream|wish': 'aspiration and possibility',
    'love|heart|soul': 'compassion and warmth',
    'change|growth|transform': 'evolution and becoming'
  };

  const themes: string[] = [];
  
  for (const [pattern, theme] of Object.entries(themeMap)) {
    if (new RegExp(pattern).test(content)) {
      themes.push(theme);
    }
  }

  return themes.length > 0 ? themes.slice(0, 2).join(' and ') : 'personal growth and self-discovery';
};

// Track consecutive failures to implement circuit breaker pattern
let consecutiveImageFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
let imageGenerationDisabled = false;

// Generate custom background image using DALL-E 3
export const generateCustomBackground = async (
  archetype: string, 
  userInput: string, 
  response: string, 
  quote: string,
  styleIndex?: number
): Promise<string | null> => {
  if (!openai || imageGenerationDisabled) {
    console.log('🎨 OpenAI client not available or image generation disabled, using solid color background');
    return getSolidColorBackground(archetype);
  }

  const actualStyleIndex = styleIndex || 0;
  
  // Check cache first
  const cachedBackground = getCachedBackground(archetype, userInput, actualStyleIndex);
  if (cachedBackground) {
    console.log(`🚀 Using cached background for ${archetype}:${actualStyleIndex}`);
    return cachedBackground;
  }

  // Check if we're already generating this background to avoid duplicates
  const cacheKey = getBackgroundCacheKey(archetype, userInput, actualStyleIndex);
  const existingGeneration = backgroundGenerationCache.get(cacheKey);
  if (existingGeneration) {
    console.log(`⏳ Background generation already in progress for ${cacheKey}, waiting...`);
    return await existingGeneration;
  }

  // Start new generation and cache the promise
  const generationPromise = generateBackgroundImage(archetype, userInput, response, quote, actualStyleIndex);
  backgroundGenerationCache.set(cacheKey, generationPromise);

  try {
    const result = await generationPromise;
    
    // Cache successful result
    if (result) {
      setCachedBackground(archetype, userInput, actualStyleIndex, result);
      // Reset failure count on success
      consecutiveImageFailures = 0;
    } else {
      // Increment failure count
      consecutiveImageFailures++;
      if (consecutiveImageFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log(`🚫 Disabling image generation after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
        imageGenerationDisabled = true;
      }
      
      // Try Gemini image generation as fallback before using solid colors
      console.log('🔄 DALL-E failed, trying Gemini image generation as fallback...');
      try {
        const { generateImageWithGemini } = await import('./gemini');
        const geminiResult = await generateImageWithGemini(userInput, archetype);
        
        if (geminiResult.backgroundImage) {
          console.log('✅ Gemini image generation successful as DALL-E fallback');
          // Cache the Gemini result
          setCachedBackground(archetype, userInput, actualStyleIndex, geminiResult.backgroundImage);
          return geminiResult.backgroundImage;
        }
      } catch (geminiError) {
        console.error('❌ Gemini fallback also failed:', geminiError);
      }
      
      // Final fallback: solid color background
      return getSolidColorBackground(archetype);
    }
    
    return result;
  } finally {
    // Clean up the generation cache
    backgroundGenerationCache.delete(cacheKey);
  }
};

// Actual image generation function (extracted from generateCustomBackground)
const generateBackgroundImage = async (
  archetype: string, 
  userInput: string, 
  response: string, 
  quote: string,
  styleIndex: number
): Promise<string | null> => {
  
  // Circuit breaker: if too many consecutive failures, disable image generation temporarily
  if (imageGenerationDisabled) {
    console.log('🎨 Image generation temporarily disabled due to consecutive failures, using solid color background');
    return getSolidColorBackground(archetype);
  }

  if (!openai) {
    console.log('🎨 OpenAI client not available or image generation disabled, using solid color background');
    return getSolidColorBackground(archetype);
  }

  const prompt = generateImagePrompt(archetype, userInput, response, quote, styleIndex);
  const cacheKey = getBackgroundCacheKey(archetype, userInput, styleIndex);
  
  // Check cache first
  const cachedImage = getCachedBackground(archetype, userInput, styleIndex);
  if (cachedImage) {
    console.log(`📸 Using cached background for ${archetype}`);
    return cachedImage;
  }

  try {
    console.log(`🎨 DALL-E: Generating image with prompt: ${prompt}`);
    
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    if (imageResponse.data && imageResponse.data[0] && imageResponse.data[0].url) {
      console.log('🎨 DALL-E: Image generated successfully');
      const imageUrl = imageResponse.data[0].url;
      
      // Cache the successful result
      setCachedBackground(archetype, userInput, styleIndex, imageUrl);
      
      // Reset failure counter on success
      consecutiveImageFailures = 0;
      
      return imageUrl;
    } else {
      throw new Error('No image URL in DALL-E response');
    }

  } catch (error: any) {
    console.error(`🎨 DALL-E: Error generating image:`, error);
    
    // Increment failure counter
    consecutiveImageFailures++;
    
    // If this is a content policy violation, try a very simple fallback prompt
    if (error.status === 400 && error.type === 'image_generation_user_error') {
      console.log('🎨 DALL-E: Content policy violation, trying fallback prompt...');
      
      try {
        const fallbackPrompt = "Soft aesthetic background with warm lighting, minimalist composition, perfect for text overlay, Instagram-worthy";
        
        const fallbackResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: fallbackPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        });

        if (fallbackResponse.data && fallbackResponse.data[0] && fallbackResponse.data[0].url) {
          console.log('🎨 DALL-E: Fallback image generated successfully');
          
          // Reset failure counter on success
          consecutiveImageFailures = 0;
          
          return fallbackResponse.data[0].url;
        }

      } catch (fallbackError: any) {
        console.log(`🎨 DALL-E: Fallback also failed:`, fallbackError);
      }
    }
    
    // Check if we should disable image generation temporarily
    if (consecutiveImageFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`🎨 DALL-E: ${consecutiveImageFailures} consecutive failures, temporarily disabling image generation`);
      imageGenerationDisabled = true;
      
      // Re-enable after 10 minutes
      setTimeout(() => {
        console.log('🎨 DALL-E: Re-enabling image generation after cooldown period');
        imageGenerationDisabled = false;
        consecutiveImageFailures = 0;
      }, 10 * 60 * 1000); // 10 minutes
    }
    
    // Try Gemini image generation before falling back to solid colors
    console.log('🔄 DALL-E completely failed, trying Gemini image generation...');
    try {
      const { generateImageWithGemini } = await import('./gemini');
      const geminiResult = await generateImageWithGemini(userInput, archetype);
      
      if (geminiResult.backgroundImage) {
        console.log('✅ Gemini image generation successful after DALL-E failure');
        return geminiResult.backgroundImage;
      }
    } catch (geminiError) {
      console.error('❌ Gemini fallback also failed:', geminiError);
    }
    
    // Final fallback: solid color background
    console.log('🎨 Using solid color background as final fallback');
    return getSolidColorBackground(archetype);
  }
};

// Regenerate background with a different style
export const regenerateBackground = async (
  archetype: string, 
  userInput: string, 
  response: string, 
  quote: string,
  currentStyleIndex?: number,
  canGenerateAI: boolean = true
): Promise<{ backgroundImage: string | null; styleIndex: number; styleName: string }> => {
  const styles = archetypeVisualStyles[archetype as keyof typeof archetypeVisualStyles];
  
  if (!styles || !Array.isArray(styles)) {
    console.log('🎨 No styles available, using Gemini image generation...');
    try {
      const { generateImageWithGemini } = await import('./gemini');
      const geminiResult = await generateImageWithGemini(userInput, archetype, canGenerateAI);
      return {
        backgroundImage: geminiResult.backgroundImage,
        styleIndex: 0,
        styleName: geminiResult.backgroundType === 'ai-generated' ? 'AI Generated' : 'Contextual'
      };
    } catch (error) {
      console.error('❌ Gemini image generation failed:', error);
      return { backgroundImage: null, styleIndex: 0, styleName: 'Default' };
    }
  }

  // Get next style (cycle through available styles)
  const nextStyleIndex = currentStyleIndex !== undefined ? (currentStyleIndex + 1) % styles.length : Math.floor(Math.random() * styles.length);
  const selectedStyle = styles[nextStyleIndex];
  
  console.log(`🔄 Regenerating background for ${archetype} with style: ${selectedStyle.name}`);
  
  // Check cache first for this style
  const cachedBackground = getCachedBackground(archetype, userInput, nextStyleIndex);
  if (cachedBackground) {
    console.log(`🚀 Using cached regenerated background for ${archetype}:${nextStyleIndex}`);
    return {
      backgroundImage: cachedBackground,
      styleIndex: nextStyleIndex,
      styleName: selectedStyle.name
    };
  }
  
  // Check if AI background generation is allowed
  if (!canGenerateAI) {
    console.log('🎨 AI background regeneration blocked - using contextual color background');
    const { getContextualBackground } = await import('./gemini');
    const contextualBackground = getContextualBackground(userInput, archetype);
    return {
      backgroundImage: contextualBackground,
      styleIndex: nextStyleIndex,
      styleName: 'Contextual Color'
    };
  }

  // Check if OpenAI is available and image generation is not disabled
  let backgroundImage: string | null = null;
  
  if (openai && !imageGenerationDisabled) {
    console.log('🎨 Trying DALL-E for background regeneration...');
    backgroundImage = await generateCustomBackground(archetype, userInput, response, quote, nextStyleIndex);
  } else {
    console.log('🎨 OpenAI disabled or not available, using Gemini for regeneration...');
  }
  
  // If DALL-E failed or unavailable, try Gemini image generation
  if (!backgroundImage) {
    console.log('🔄 Using Gemini image generation for regenerate...');
    try {
      const { generateImageWithGemini } = await import('./gemini');
      const geminiResult = await generateImageWithGemini(userInput, archetype, canGenerateAI);
      
      if (geminiResult.backgroundImage) {
        backgroundImage = geminiResult.backgroundImage;
        console.log('✅ Gemini image generation successful for regenerate');
        
        // Cache the Gemini result
        setCachedBackground(archetype, userInput, nextStyleIndex, backgroundImage);
        
        return {
          backgroundImage,
          styleIndex: nextStyleIndex,
          styleName: geminiResult.backgroundType === 'ai-generated' ? 'AI Generated (Gemini)' : 'Contextual Color'
        };
      }
    } catch (geminiError) {
      console.error('❌ Gemini image generation failed:', geminiError);
      // Use solid color as final fallback
      backgroundImage = getSolidColorBackground(archetype);
    }
  }
  
  return {
    backgroundImage,
    styleIndex: nextStyleIndex,
    styleName: selectedStyle.name
  };
};

// Cache for text responses (existing)
const responseCache = new Map<string, ArchetypeData>();

// Cache for background images - key: archetype:userInput:styleIndex, value: imageUrl
const backgroundCache = new Map<string, string>();

// Cache for background generation to avoid duplicate requests
const backgroundGenerationCache = new Map<string, Promise<string | null>>();

// Generate cache key
const getCacheKey = (userInput: string, archetypeName: string): string => {
  return `${archetypeName}:${userInput.toLowerCase().trim()}`;
};

// Generate cache key for background images
const getBackgroundCacheKey = (archetype: string, userInput: string, styleIndex: number): string => {
  return `${archetype}:${userInput.toLowerCase().trim()}:${styleIndex}`;
};

// Get cached background image
const getCachedBackground = (archetype: string, userInput: string, styleIndex: number): string | null => {
  const key = getBackgroundCacheKey(archetype, userInput, styleIndex);
  return backgroundCache.get(key) || null;
};

// Store background image in cache
const setCachedBackground = (archetype: string, userInput: string, styleIndex: number, imageUrl: string): void => {
  const key = getBackgroundCacheKey(archetype, userInput, styleIndex);
  backgroundCache.set(key, imageUrl);
  console.log(`💾 Cached background for ${key}`);
};

// Popular prompts that we can pre-generate backgrounds for
const popularPrompts = [
  "I feel lost",
  "I'm overwhelmed",
  "I need motivation",
  "I feel anxious",
  "I'm stressed",
  "I feel invisible",
  "I need confidence",
  "I'm tired",
  "I feel stuck",
  "I need clarity"
];

// Pre-generate backgrounds for popular prompts (run in background)
export const preGeneratePopularBackgrounds = async (): Promise<void> => {
  if (!openai || imageGenerationDisabled) {
    console.log('🎨 OpenAI not available or image generation disabled, skipping pre-generation');
    return;
  }

  console.log('🚀 Starting background pre-generation for popular prompts...');
  
  const archetypeNames = Object.keys(archetypes);
  
  // Only use the first 2 popular prompts to avoid overwhelming the API
  const limitedPrompts = popularPrompts.slice(0, 2);
  
  // Generate backgrounds for each archetype + popular prompt combination
  // Only generate style index 0 (default style) to avoid overwhelming the API
  for (const prompt of limitedPrompts) {
    for (const archetypeName of archetypeNames) {
      const cacheKey = getBackgroundCacheKey(archetypeName, prompt, 0);
      
      // Skip if already cached
      if (backgroundCache.has(cacheKey)) {
        continue;
      }
      
      try {
        // Add longer delay to avoid rate limiting and content policy triggers
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds between requests
        
        console.log(`🎨 Pre-generating background for ${archetypeName}: "${prompt}"`);
        
        // Generate a simple response for the background generation
        const archetype = archetypes[archetypeName];
        const simpleResponse = `${archetype.description} response to: ${prompt}`;
        const simpleQuote = `Inspirational quote for ${prompt}`;
        
        const backgroundUrl = await generateCustomBackground(
          archetypeName, 
          prompt, 
          simpleResponse, 
          simpleQuote, 
          0
        );
        
        if (backgroundUrl) {
          console.log(`✅ Pre-generated background for ${archetypeName}: "${prompt}"`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to pre-generate background for ${archetypeName}: "${prompt}"`, error);
        // Continue with next combination instead of stopping
        continue;
      }
    }
  }
  
  console.log('🎉 Background pre-generation completed');
};

// Fast text-only generation (no background image)
export async function generateSubliminalResponseFast(
  userInput: string,
  archetypeName: string
): Promise<ArchetypeData> {
  const archetype = archetypes[archetypeName];
  
  if (!archetype) {
    throw new Error(`Unknown archetype: ${archetypeName}`);
  }

  console.log(`⚡ Fast generating content for archetype: ${archetypeName}, input: "${userInput}"`);

  // Check cache first
  const cacheKey = getCacheKey(userInput, archetypeName);
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse) {
    console.log(`⚡ Using cached response for ${archetypeName}`);
    return cachedResponse;
  }

  // If no OpenAI client, throw error so Gemini can be used as fallback
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = archetype.promptTemplate.replace('{userInput}', userInput);

  try {
    console.log('🤖 Making OpenAI API call...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert in creating personalized, culturally relevant subliminal messages and modern affirmations. You understand current social media language, trending phrases, and how to create content that feels authentic and shareable. You speak like a wise bestie who gets it. You respond only in valid JSON format as specified in the prompt. Make every response unique, original, and never generic.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    console.log('✅ OpenAI API call successful');
    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log('✅ Successfully parsed OpenAI response');
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', responseContent);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate the response structure
    if (!parsedResponse.response || !parsedResponse.fullMessage || !parsedResponse.quote || !parsedResponse.tags) {
      console.error('❌ Incomplete response structure:', parsedResponse);
      throw new Error('Incomplete response from OpenAI');
    }

    console.log('⚡ Successfully generated fast text-only response');
    const result: ArchetypeData = {
      icon: archetype.icon,
      response: parsedResponse.response,
      fullMessage: parsedResponse.fullMessage,
      quote: parsedResponse.quote,
      tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags : [],
      // No background image in fast mode
    };

    // Cache the response
    responseCache.set(cacheKey, result);
    
    return result;

  } catch (error: any) {
    // Only log if it's not a quota error (quota errors are expected and handled)
    if (!error.message?.includes('quota') && error.status !== 429) {
      console.error('❌ OpenAI API Error Details:', {
        message: error?.message,
        status: error?.status,
        type: error?.type,
        code: error?.code
      });
    }
    // Re-throw the error so server.ts can catch it and use Gemini fallback
    throw error;
  }
}

// Helper function to get style name
export const getStyleName = (archetype: string, styleIndex: number): string => {
  const styles = archetypeVisualStyles[archetype as keyof typeof archetypeVisualStyles];
  
  if (!styles || !Array.isArray(styles) || styleIndex >= styles.length) {
    return 'Default';
  }
  
  return styles[styleIndex]?.name || 'Default';
};

// Original function with background generation (kept for compatibility)
export async function generateSubliminalResponse(
  userInput: string,
  archetypeName: string,
  canGenerateAI: boolean = true
): Promise<ArchetypeData> {
  console.log(`Generating content for archetype: ${archetypeName}, input: "${userInput}"`);
  
  // Check if OpenAI is available and not over quota
  if (!openai) {
    console.log('🔄 OpenAI not available, using Gemini...');
    // Import and use Gemini as fallback
    const { generateSubliminalResponseWithGemini } = await import('./gemini');
    return generateSubliminalResponseWithGemini(userInput, archetypeName);
  }

  try {
    console.log('🤖 Making OpenAI API call...');
    
    const prompt = `Generate a profound, original subliminal response for the ${archetypeName} archetype.

User input: "${userInput}"

Create a response that is:
- Deeply personal and specific to their situation
- ORIGINAL quotes only (never use existing quotes from real people)
- Contextual and meaningful
- Feels like a keepsake they'd want to save

Respond in JSON format:
{
  "response": "Brief, impactful response",
  "fullMessage": "Expanded, detailed response",
  "quote": "Original, quotable phrase - never use real quotes from famous people",
  "tags": ["relevant", "tags", "here"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('✅ OpenAI API call successful');
    
    // Parse OpenAI response
    let parsedResponse;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const cleanContent = jsonMatch[1] || content;
      parsedResponse = JSON.parse(cleanContent.trim());
      console.log('✅ Successfully parsed OpenAI response');
    } catch (parseError) {
      console.log('⚠️ Failed to parse OpenAI JSON, using Gemini fallback...');
      const { generateSubliminalResponseWithGemini } = await import('./gemini');
      return generateSubliminalResponseWithGemini(userInput, archetypeName);
    }

    // Try to generate background image, but fall back to contextual colors if DALL-E fails
    console.log('🎨 Starting background image generation...');
    let backgroundImage: string | null = null;
    let backgroundType = 'contextual-color';
    
    // Check if AI background generation is allowed
    if (canGenerateAI) {
      try {
        backgroundImage = await generateBackgroundImage(
          archetypeName, 
          userInput, 
          parsedResponse.response, 
          parsedResponse.quote,
          0
        );
        if (backgroundImage) {
          backgroundType = 'dalle';
        }
      } catch (dalleError) {
        console.log('🎨 DALL-E failed, using contextual color background...');
        // Generate contextual background based on emotions and archetype
        const { getContextualBackground } = await import('./gemini');
        backgroundImage = getContextualBackground(userInput, archetypeName);
        backgroundType = 'contextual-color';
      }
    } else {
      console.log('🎨 AI background generation blocked - using contextual color background');
      // Generate contextual background based on emotions and archetype
      const { getContextualBackground } = await import('./gemini');
      backgroundImage = getContextualBackground(userInput, archetypeName);
      backgroundType = 'contextual-color';
    }

    const archetypeData = archetypes[archetypeName];
    if (!archetypeData) {
      throw new Error(`Unknown archetype: ${archetypeName}`);
    }

    const result: ArchetypeData = {
      icon: archetypeData.icon,
      response: parsedResponse.response || 'Your journey matters, and so do you.',
      fullMessage: parsedResponse.fullMessage || parsedResponse.response || 'Your journey matters, and so do you.',
      quote: parsedResponse.quote || 'Growth happens in the spaces between who you were and who you\'re becoming.',
      tags: parsedResponse.tags || ['wisdom', 'growth', 'reflection'],
      backgroundImage: backgroundImage || createDefaultBackground(archetypeName),
      backgroundType: backgroundType
    };

    console.log('✅ Successfully generated complete response with background');
    return result;

  } catch (error: any) {
    // Check if it's a quota/billing error and fall back to Gemini
    if (error.message?.includes('quota') || error.message?.includes('billing') || error.status === 429) {
      console.log('🔄 OpenAI quota exceeded, switching to Gemini...');
      const { generateSubliminalResponseWithGemini } = await import('./gemini');
      return generateSubliminalResponseWithGemini(userInput, archetypeName);
    }
    
    // Only log non-quota errors
    console.error('❌ OpenAI error:', error);
    
    // For any other error, also fall back to Gemini
    console.log('🔄 OpenAI failed, falling back to Gemini...');
    const { generateSubliminalResponseWithGemini } = await import('./gemini');
    return generateSubliminalResponseWithGemini(userInput, archetypeName);
  }
}

function getFallbackResponse(archetype: any, userInput: string): ArchetypeData {
  // Generate archetype-specific fallback responses that match the original natural personalities
  const fallbackResponses = {
    Mirror: {
      response: `Everything you're feeling right now is completely valid. This isn't something to fix - it's something to understand and honor.`,
      fullMessage: `I see what's happening inside you right now, and I want you to know that all of it - every single feeling, every doubt, every moment of uncertainty - it's all completely valid. You don't need to apologize for feeling human. You don't need to make this smaller or neater or more palatable for anyone else. This is your truth speaking, and your truth matters. You're not too much. You're not broken. You're not doing this wrong. You're being beautifully, courageously human, and that's exactly what you're supposed to be doing right now.`,
      quote: `"Your feelings aren't obstacles to overcome - they're information your soul is giving you about what matters most."`,
      tags: ['emotional-validation', 'self-acceptance', 'inner-truth', 'authenticity', 'emotional-intelligence']
    },
    Therapist: {
      response: `Your nervous system is responding exactly as it should given what you've experienced. This reaction makes complete therapeutic sense.`,
      fullMessage: `From a clinical perspective, what you're experiencing is a completely normal response to your circumstances. Your nervous system is doing exactly what it's designed to do - protect you. When we look at attachment theory and polyvagal responses, your emotional regulation patterns make perfect sense. You're not broken; you're adapted. Your inner child is trying to communicate something important, and all parts of you deserve compassion. Healing isn't about fixing yourself - it's about integration and understanding. You're exactly where you need to be in this process.`,
      quote: `"Healing happens when we stop pathologizing our pain and start understanding it as information."`,
      tags: ['nervous-system', 'attachment-theory', 'parts-work', 'trauma-informed', 'clinical-perspective']
    },
    Realist: {
      response: `Look, here's the thing - you can keep spinning your wheels, or you can channel this energy into something that actually moves the needle.`,
      fullMessage: `I'm going to be real with you because that's what you need right now. This situation sucks, but sitting in it isn't going to change anything. You've got two choices: keep replaying this story that's keeping you stuck, or start writing a new one. You're stronger than you think you are, and you've handled hard things before. So what's it going to be? Are you going to let this define you, or are you going to take your power back? The choice is yours, and honestly, you already know what you need to do. Now it's just about whether you're ready to do it.`,
      quote: `"You can't control what happened to you, but you absolutely control what happens next."`,
      tags: ['personal-accountability', 'forward-action', 'tough-love', 'pragmatic-wisdom', 'empowerment']
    },
    Poet: {
      response: `You are writing yourself into existence with every breath. This moment is not your ending - it's your becoming.`,
      fullMessage: `Darling, you are not falling apart - you are falling into place, like autumn leaves that know exactly when to let go. Your heart is composing poetry from pain, weaving wisdom from wounds, creating something achingly beautiful from the raw materials of your human experience. This isn't your tragic ending; this is your plot twist. You are being rewritten by life itself, character by character, line by line, into someone more luminous than you ever imagined possible. Trust the process of your becoming, even when you can't see the final stanza yet.`,
      quote: `"In the museum of your life, this moment will be labeled 'The Day Everything Changed for the Better.'"`,
      tags: ['poetic-transformation', 'spiritual-metaphor', 'creative-healing', 'soul-journey', 'lyrical-wisdom']
    },
    'Best Friend': {
      response: `Hey bestie, I see you right now and I need you to know that everything you're feeling is so valid. You don't have to carry this alone, and you definitely don't need to have it all figured out.`,
      fullMessage: `Hey bestie, I'm right here with you, and I need you to know that what you're going through makes complete sense. You're not too much, you're not being dramatic, and you definitely don't need to apologize for feeling human. Be so for real - you've handled hard things before, and I've watched you grow in ways that still amaze me. It's giving strength even when you don't feel it. Not too much on my friend, but you're way more resilient than you're giving yourself credit for. I got you, always. We're going to get through this together, just like we always do.`,
      quote: `"You don't have to be perfect to be loved - I choose you on your messy days too, bestie."`,
      tags: ['loyalty', 'emotional-support', 'friendship', 'validation', 'unconditional-love']
    },
    Coach: {
      response: `Here's the real talk. You're running drills in your head instead of getting on the field. Time to stop overthinking and start executing.`,
      fullMessage: `Alright, listen up. I see what's happening here - you're treating this like it's the championship when it's just practice. That mental replay you're doing? That's not preparation, that's avoidance. You've got the fundamentals, you've put in the work, but now you're letting your head play games with you. Every athlete goes through this. The difference between good and great? Great ones trust their training and execute anyway. Your technique might not be perfect, but your heart's in the right place. Stop overthinking, start moving. This is your moment. Execute.`,
      quote: `"Champions aren't made in the comfort zone - they're made when it's time to execute."`,
      tags: ['discipline', 'mental-toughness', 'performance', 'action', 'coaching']
    }
  };

  const fallback = fallbackResponses[archetype.name as keyof typeof fallbackResponses] || fallbackResponses.Mirror;
  
  return {
    icon: archetype.icon,
    response: fallback.response,
    fullMessage: fallback.fullMessage,
    quote: fallback.quote,
    tags: fallback.tags
  };
}

// Get solid color background based on archetype
const getSolidColorBackground = (archetype: string): string => {
  const colors = {
    Mirror: '#4A90E2',      // Soft blue
    Therapist: '#7ED321',   // Soft green  
    Realist: '#9013FE',     // Purple
    Poet: '#FF6B6B',        // Soft red
    BestFriend: '#FFD93D',  // Warm yellow
    Coach: '#FF8500'        // Athletic orange
  };
  
  const color = colors[archetype as keyof typeof colors] || '#6B73FF';
  
  // Return a data URL for a solid color background
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.4" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `).toString('base64')}`;
};

// Helper function to create default background
function createDefaultBackground(archetype: string): string {
  const colors = {
    'Mirror': '#4A90E2',
    'Therapist': '#7ED321', 
    'Realist': '#9013FE',
    'Poet': '#FF6B6B',
    'Best Friend': '#FFD93D',
    'Coach': '#FF8500'
  };
  
  const color = colors[archetype as keyof typeof colors] || '#4A90E2';
  
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${color}" opacity="0.6"/>
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

 