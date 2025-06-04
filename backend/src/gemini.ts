import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { ArchetypeData } from './types';
import { archetypes } from './archetypes';
import { GoogleAuth } from 'google-auth-library';

// Load environment variables first
dotenv.config();

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
let gemini: GoogleGenerativeAI | null = null;
let geminiModel: any = null;

if (geminiApiKey) {
  try {
    gemini = new GoogleGenerativeAI(geminiApiKey);
    geminiModel = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Gemini client initialized successfully');
    
    // Check Vertex AI configuration
    const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
    if (googleCloudProject) {
      console.log('🎨 Vertex AI Imagen 3 integration available for AI-generated backgrounds');
    } else {
      console.log('⚠️ GOOGLE_CLOUD_PROJECT not set - Vertex AI Imagen disabled (will use contextual backgrounds)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Gemini:', error);
  }
} else {
  console.log('⚠️ GEMINI_API_KEY not found - Gemini integration disabled');
}

// Cache for responses
const geminiResponseCache = new Map<string, ArchetypeData>();

// Generate cache key
const getGeminiCacheKey = (userInput: string, archetypeName: string): string => {
  return `gemini:${archetypeName}:${userInput.toLowerCase().trim()}`;
};

// Generate subliminal response using Gemini
export async function generateSubliminalResponseWithGemini(
  userInput: string,
  archetypeName: string
): Promise<ArchetypeData> {
  const archetype = archetypes[archetypeName];
  
  if (!archetype) {
    throw new Error(`Unknown archetype: ${archetypeName}`);
  }

  console.log(`🔄 Generating content with Gemini for archetype: ${archetypeName}, input: "${userInput}"`);

  if (!gemini || !geminiModel) {
    console.log('❌ Gemini not available, using fallback');
    return getFallbackResponse(archetype, userInput, archetypeName);
  }

  // Use enhanced prompt for deeper, more profound responses
  const enhancedPrompt = getEnhancedArchetypePrompt(userInput, archetypeName);

  try {
    console.log('✨ Making Gemini API call...');
    const result = await geminiModel.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('🔍 Raw Gemini response:', text);
    
    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from potential markdown formatting
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
      const cleanText = jsonMatch[1] || text;
      
      // Try parsing the cleaned text
      parsedResponse = JSON.parse(cleanText.trim());
      console.log('✅ Successfully parsed Gemini JSON response');
    } catch (parseError) {
      console.log('⚠️ Failed to parse JSON, extracting text manually');
      // Fallback: extract meaningful content manually
      parsedResponse = {
        response: text.split('\n')[0] || 'Your journey matters, and so do you.',
        fullMessage: text || 'Your journey matters, and so do you.',
        quote: 'Growth happens in the spaces between who you were and who you\'re becoming.',
        tags: ['wisdom', 'growth', 'reflection']
      };
    }

    // Generate contextual background using Gemini or fallback to solid colors
    const backgroundResult = await generateImageWithGemini(userInput, archetypeName);

    const result_data: ArchetypeData = {
      icon: archetype.icon,
      response: parsedResponse.response || 'Your journey matters, and so do you.',
      fullMessage: parsedResponse.fullMessage || parsedResponse.response || 'Your journey matters, and so do you.',
      quote: parsedResponse.quote || 'Growth happens in the spaces between who you were and who you\'re becoming.',
      tags: parsedResponse.tags || ['wisdom', 'growth', 'reflection'],
      backgroundImage: backgroundResult.backgroundImage,
      backgroundType: backgroundResult.backgroundType
    };

    console.log('✅ Successfully generated complete response with Gemini');
    return result_data;

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return getFallbackResponse(archetype, userInput, archetypeName);
  }
}

function getEnhancedArchetypePrompt(userInput: string, archetypeName: string): string {
  // Natural, authentic prompts that capture each archetype's essence without rigid templates
  const enhancedPrompts = {
    Mirror: `You are the Mirror archetype - you reflect back the user's deepest truths with clarity and insight. They've shared: "${userInput}"

Your voice is direct, honest, and uses metaphorical language about spaces, belonging, light, and growth. You help them see their patterns clearly. You're validating but also honest about what needs to shift.

Write naturally - don't force specific openings. Sometimes start with observations, sometimes with questions, sometimes with direct truth. Use metaphors of rooms, fitting, shrinking, expanding, light, dimming, brightness.

Generate a JSON response:
{
  "response": "A clear, reflective response that helps them see their truth",
  "fullMessage": "Expanded insight about their patterns and what's really happening",  
  "quote": "Original quote about truth/growth/belonging - never use real quotes",
  "tags": ["reflection", "inner-truth", "clarity", "self-awareness", "growth"]
}`,

    Therapist: `You are the Therapist archetype - warm, understanding, professionally supportive but NOT conducting therapy. They've shared: "${userInput}"

Your voice is gentle, validating, and offers comfort without being clinical. You're the understanding professional who normalizes their experience and offers hope. Mention nervous system/attachment concepts only lightly when truly relevant.

NO therapy language like "let's explore techniques" or "we can work together" - you're offering understanding and support, not treatment.

Generate a JSON response:
{
  "response": "Warm, validating response that normalizes what they're experiencing",
  "fullMessage": "Supportive insight that offers hope and understanding without being clinical",
  "quote": "Original comforting quote with professional warmth - never use real quotes", 
  "tags": ["healing", "therapy", "validation", "emotional-regulation", "support"]
}`,

    Realist: `You are the Realist archetype - practical, grounded, direct truth-telling with love. They've shared: "${userInput}"

Your voice cuts through the noise with practical wisdom. You're the friend who tells hard truths but with care. You use practical metaphors (tools, building, working) and offer actionable perspective.

Be direct but not harsh. Focus on what's actually happening and what they can do about it. No philosophical tangents - just grounded, practical reality.

Generate a JSON response:
{
  "response": "Direct, practical assessment of what's really happening",
  "fullMessage": "Grounded perspective with actionable insight and realistic hope",
  "quote": "Original practical quote with actionable wisdom - never use real quotes",
  "tags": ["practical-wisdom", "honesty", "grounded", "real-talk", "clarity"]
}`,

    Poet: `You are the Poet archetype - pure artistic expression through creative writing. They've shared: "${userInput}"

Your voice transforms their experience into beautiful artistic forms. Choose the perfect creative format for their input: haiku, free verse, sonnet, original lyrics, prose poetry, short verses, or any artistic form that captures their moment.

Sometimes a simple haiku captures everything. Sometimes flowing free verse. Sometimes song lyrics. Sometimes a thoughtful artistic moment. Let the user's input guide your creative choice.

DO NOT explain your choice or analyze your work. Just create beautiful, original art with words.

Generate a JSON response:
{
  "response": "Beautiful artistic response in whatever form fits best - haiku, verse, lyrics, etc.",
  "fullMessage": "Extended or additional artistic content - more poetry/art, never explanation",
  "quote": "Original artistic quote that feels like art - never use real quotes", 
  "tags": ["poetry", "beauty", "transformation", "soul-stirring", "artistic"]
}`,

    "Best Friend": `You are the Best Friend archetype - contemporary, supportive, authentically hyping them up. They've shared: "${userInput}"

Your voice is current, supportive, and celebratory. Vary your openings naturally - sometimes "Hey", sometimes "Listen", sometimes "Okay but", sometimes "Literally", sometimes "Bestie". Use contemporary language authentically.

Be incredibly supportive and make them feel seen. Use current phrases naturally when they fit, but don't force slang.

IMPORTANT: Your quote should be SHORT, aesthetic, Instagram-worthy - like these examples:
- "Great things don't often come with comfort zones"
- "When you focus on the good, the good gets better"  
- "The most beautiful thing a person can be is confident"
- "Your life has its own timing"
- "Chase what makes you feel the sun from the inside out"

Make it shareable, inspirational, and in Best Friend voice but CONCISE (1-2 sentences max).

Generate a JSON response:
{
  "response": "Contemporary, supportive response that hypes them up authentically",
  "fullMessage": "Expanded support that celebrates their journey and validates them",
  "quote": "Short, aesthetic, Best Friend-voiced original quote (like 'Your timing is perfect, even when it doesn't feel like it')",
  "tags": ["support", "contemporary", "friendship", "celebration", "encouragement"]
}`
  };

  const basePrompt = enhancedPrompts[archetypeName as keyof typeof enhancedPrompts];
  
  if (!basePrompt) {
    return `You are the ${archetypeName} archetype. Create a profound, original response to: "${userInput}"
    
    CRITICAL: 
    - Your quote must be completely ORIGINAL - NEVER use existing quotes from real people (Rumi, Maya Angelou, etc.)
    - If you're Poet, ONLY write poetry - never explain or analyze it
    - If you're Therapist, offer support but don't conduct therapy sessions
    
    Respond in JSON format with: response, fullMessage, quote, tags`;
  }
  
  return basePrompt;
}

export async function generateImageWithGemini(
  userInput: string, 
  archetypeName: string
): Promise<{backgroundImage: string, backgroundType: string}> {
  
  try {
    console.log('🎨 Attempting Vertex AI Imagen 3 generation...');
    
    // Try Vertex AI Imagen 3 for AI-generated backgrounds
    const imageUrl = await generateImageWithVertexAI(userInput, archetypeName);
    
    if (imageUrl) {
      console.log('✅ Vertex AI Imagen 3 generation successful');
      return {
        backgroundImage: imageUrl,
        backgroundType: 'ai-generated'
      };
    }
  } catch (error) {
    console.error('❌ Vertex AI Imagen 3 failed:', error);
  }
  
  try {
    console.log('🎨 Vertex AI failed, attempting Hugging Face generation...');
    
    // Try Hugging Face as secondary fallback
    const huggingFaceUrl = await generateImageWithHuggingFace(userInput, archetypeName);
    
    if (huggingFaceUrl) {
      console.log('✅ Hugging Face generation successful');
      return {
        backgroundImage: huggingFaceUrl,
        backgroundType: 'ai-generated'
      };
    }
  } catch (error) {
    console.error('❌ Hugging Face generation failed:', error);
  }
  
  // Final fallback to contextual color backgrounds
  console.log('🎨 Using contextual color background fallback');
  const contextualBackground = getContextualBackground(userInput, archetypeName);
  
  return {
    backgroundImage: contextualBackground,
    backgroundType: 'contextual-color'
  };
}

async function generateImageWithVertexAI(userInput: string, archetypeName: string): Promise<string | null> {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    
    if (!projectId) {
      console.log('⚠️ GOOGLE_CLOUD_PROJECT not configured, skipping Vertex AI Imagen');
      return null;
    }

    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    const authClient = await auth.getClient();
    const token = await authClient.getAccessToken();
    
    if (!token || !token.token) {
      throw new Error('Failed to get Google Cloud access token');
    }

    const location = 'us-central1'; // Imagen is available in us-central1
    
    // Create image prompt based on user input and archetype
    const imagePrompt = createImagePrompt(userInput, archetypeName);
    
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-002:predict`;
    
    const requestBody = {
      instances: [{
        prompt: imagePrompt
      }],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        personGeneration: "allow_adult"
      }
    };

    console.log(`🎨 Vertex AI: Generating image with prompt: ${imagePrompt}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI request failed: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    // Type the Vertex AI response structure
    interface VertexAIResponse {
      predictions?: Array<{
        bytesBase64Encoded?: string;
      }>;
    }
    
    const typedData = data as VertexAIResponse;
    
    if (typedData.predictions && typedData.predictions[0] && typedData.predictions[0].bytesBase64Encoded) {
      const base64Image = typedData.predictions[0].bytesBase64Encoded;
      console.log('🎨 Vertex AI: Image generated successfully');
      return `data:image/png;base64,${base64Image}`;
    }
    
    throw new Error('No image data in Vertex AI response');
    
  } catch (error) {
    console.error('❌ Vertex AI Imagen error:', error);
    return null;
  }
}

async function generateImageWithHuggingFace(userInput: string, archetypeName: string): Promise<string | null> {
  try {
    // Create image prompt optimized for Hugging Face models
    const imagePrompt = createHuggingFaceImagePrompt(userInput, archetypeName);
    
    // Use FLUX.1-dev model - one of the best free models on Hugging Face
    const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: imagePrompt,
        parameters: {
          width: 512,
          height: 512,
          num_inference_steps: 20,
          guidance_scale: 7.5
        }
      })
    });

    if (!response.ok) {
      // Try backup model if FLUX fails
      const backupResponse = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imagePrompt,
          parameters: {
            width: 512,
            height: 512
          }
        })
      });
      
      if (!backupResponse.ok) {
        throw new Error(`Hugging Face request failed: ${response.status} ${response.statusText}`);
      }
      
      const imageBlob = await backupResponse.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      
      console.log('🎨 Hugging Face: Image generated successfully with backup model (Stable Diffusion XL)');
      return `data:image/png;base64,${base64Image}`;
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    
    console.log('🎨 Hugging Face: Image generated successfully with FLUX.1-dev');
    return `data:image/png;base64,${base64Image}`;
    
  } catch (error) {
    console.error('❌ Hugging Face generation error:', error);
    return null;
  }
}

function createHuggingFaceImagePrompt(userInput: string, archetypeName: string): string {
  // Extract emotions for visual styling
  const emotions = extractEmotionalKeywords(userInput.toLowerCase());
  
  // Optimized prompts for Hugging Face diffusion models
  const archetypeStyles = {
    'Mirror': 'minimalist abstract background, soft reflections, glass textures, calming blues and whites',
    'Therapist': 'peaceful nature scene, soft natural lighting, healing atmosphere, warm earth tones',
    'Realist': 'clean modern background, geometric patterns, grounded aesthetic, muted professional colors',
    'Poet': 'artistic abstract composition, flowing organic shapes, dreamy ethereal lighting, soft pastels',
    'Best Friend': 'warm cozy atmosphere, bright cheerful colors, friendly inviting space, golden lighting'
  };

  // Emotion-based modifications
  const emotionModifiers = {
    sad: 'gentle, soothing, soft blues and grays',
    happy: 'bright, uplifting, warm golden tones',
    anxious: 'calming, peaceful, soft greens and blues', 
    angry: 'dramatic but beautiful, warm oranges and reds',
    creative: 'artistic, colorful, inspiring energy',
    tired: 'restful, cozy, soft muted tones'
  };

  let prompt = archetypeStyles[archetypeName as keyof typeof archetypeStyles] || archetypeStyles['Mirror'];
  
  // Add emotion-based styling
  if (emotions.length > 0) {
    const primaryEmotion = emotions[0];
    const modifier = emotionModifiers[primaryEmotion as keyof typeof emotionModifiers];
    if (modifier) {
      prompt += `, ${modifier}`;
    }
  }

  // Add quality and safety modifiers for Hugging Face
  prompt += ', aesthetic photography, high quality, professional, instagram worthy, clean composition, no text, no people, safe for work, abstract background suitable for mobile app';

  return prompt;
}

function createImagePrompt(userInput: string, archetypeName: string): string {
  // Extract emotions and themes from user input
  const emotions = extractEmotionalKeywords(userInput.toLowerCase());
  
  // Base archetype aesthetics
  const archetypeAesthetics = {
    'Mirror': 'reflective, mirror-like surfaces, light refraction, serene spaces, clarity',
    'Therapist': 'calming nature scenes, soft lighting, peaceful environments, healing spaces',
    'Realist': 'grounded landscapes, solid structures, practical tools, earth tones',
    'Poet': 'artistic, flowing forms, natural beauty, dreamlike quality, ethereal lighting',
    'Best Friend': 'warm, cozy spaces, bright colors, celebratory atmosphere, joyful energy'
  };

  // Emotion-based visual elements
  const emotionVisuals = {
    sad: 'soft rain, gentle mist, muted colors, calm water reflections',
    happy: 'bright sunlight, golden hour, vibrant colors, uplifting energy',
    anxious: 'peaceful forest, calming blues and greens, serene nature',
    angry: 'dramatic sunset, warm oranges and reds, powerful but beautiful',
    creative: 'artistic swirls, colorful paint strokes, creative energy',
    tired: 'restful scenes, soft pillows, cozy blankets, peaceful rest'
  };

  // Build the prompt
  let prompt = 'A beautiful, aesthetic background image featuring ';
  
  // Add archetype-specific elements
  const aesthetic = archetypeAesthetics[archetypeName as keyof typeof archetypeAesthetics] || archetypeAesthetics['Mirror'];
  prompt += aesthetic;

  // Add emotion-based elements
  if (emotions.length > 0) {
    const primaryEmotion = emotions[0];
    const visual = emotionVisuals[primaryEmotion as keyof typeof emotionVisuals];
    if (visual) {
      prompt += `, ${visual}`;
    }
  }

  // Add quality and style modifiers
  prompt += ', high quality, artistic, beautiful lighting, professional photography style, instagram aesthetic, dreamy atmosphere';

  // Keep it family-friendly and abstract
  prompt += ', abstract, no people, no text, suitable for background use';

  return prompt;
}

// Enhanced contextual background generation based on emotions and archetypes  
export function getContextualBackground(userInput: string, archetypeName: string): string {
  const emotions = extractEmotionalKeywords(userInput.toLowerCase());
  
  // Archetype-specific color themes
  const archetypeColors = {
    'Mirror': ['#4A90E2', '#6BB6FF', '#87CEEB', '#B0E0E6'],
    'Therapist': ['#7ED321', '#90EE90', '#98FB98', '#90EE90'], 
    'Realist': ['#9013FE', '#BA68C8', '#DDA0DD', '#E6E6FA'],
    'Poet': ['#FF6B6B', '#FF8E8E', '#FFA07A', '#FFB6C1'],
    'Best Friend': ['#FFD93D', '#FFE066', '#FFF8DC', '#FFFACD']
  };

  // Emotion-based color overrides
  if (emotions.includes('sad') || emotions.includes('blue') || emotions.includes('depressed')) {
    return createGradientSVG('#87CEEB', '#B0E0E6'); // Soft blues
  }
  if (emotions.includes('angry') || emotions.includes('frustrated') || emotions.includes('mad')) {
    return createGradientSVG('#FFA07A', '#FFB6C1'); // Warm oranges/soft reds
  }
  if (emotions.includes('anxious') || emotions.includes('worried') || emotions.includes('stressed')) {
    return createGradientSVG('#90EE90', '#98FB98'); // Calming greens
  }
  if (emotions.includes('happy') || emotions.includes('joy') || emotions.includes('excited')) {
    return createGradientSVG('#FFD93D', '#FFE066'); // Bright yellows
  }
  if (emotions.includes('love') || emotions.includes('romantic') || emotions.includes('heart')) {
    return createGradientSVG('#FFB6C1', '#FFA07A'); // Soft pinks
  }
  if (emotions.includes('creative') || emotions.includes('inspired') || emotions.includes('artistic')) {
    return createGradientSVG('#FF8E8E', '#FFA07A'); // Creative warm tones
  }

  // Default to archetype colors
  const colors = archetypeColors[archetypeName as keyof typeof archetypeColors] || archetypeColors['Mirror'];
  return createGradientSVG(colors[0], colors[1]);
}

function createGradientSVG(color1: string, color2: string): string {
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:0.4" />
      </radialGradient>
    </defs>
    <rect width="400" height="400" fill="url(#grad)" />
  </svg>`;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function extractEmotionalKeywords(text: string): string[] {
  const emotionalWords = [
    'happy', 'joy', 'joyful', 'excited', 'thrilled', 'elated', 'cheerful',
    'sad', 'blue', 'down', 'depressed', 'melancholy', 'sorrowful', 'gloomy',
    'angry', 'mad', 'frustrated', 'irritated', 'furious', 'annoyed', 'rage',
    'anxious', 'worried', 'stressed', 'nervous', 'overwhelmed', 'panicked',
    'love', 'loving', 'romantic', 'heart', 'affection', 'caring', 'tender',
    'creative', 'inspired', 'artistic', 'imaginative', 'innovative', 'expressive',
    'tired', 'exhausted', 'drained', 'weary', 'fatigued', 'worn', 'spent'
  ];
  
  return emotionalWords.filter(word => text.includes(word));
}

// Enhanced fallback responses that are profound and original
function getFallbackResponse(archetype: any, userInput: string, archetypeName: string): ArchetypeData {
  const fallbackResponses = {
    Mirror: {
      response: "You've been dimming yourself in spaces that can't hold your full light. Not because you've changed, but because you've outgrown what once contained you.",
      fullMessage: "You've been dimming yourself in spaces that can't hold your full light. Not because you've changed, but because you've outgrown what once contained you. The discomfort you feel isn't your weakness—it's your soul making room for expansion. You keep trying to shrink back into old patterns, old relationships, old versions of yourself that no longer fit. But you weren't meant to stay small. You were meant to grow beyond the boundaries others set for you, beyond the limits you once accepted. The ache you feel is growing pains disguised as loneliness.",
      quote: "You were never too much. The spaces around you just got too small for who you're becoming."
    },
    Therapist: {
      response: "What you're experiencing is your nervous system's way of protecting you. It makes complete sense given everything you're carrying right now.",
      fullMessage: "What you're experiencing is your nervous system's way of protecting you. It makes complete sense given everything you're carrying right now. Sometimes our bodies hold onto stress and trauma in ways that feel overwhelming, but this is actually evidence of your system's intelligence. We can work together to help your nervous system feel safe enough to regulate. This might involve exploring your attachment patterns, connecting with your inner child, or simply learning to breathe with your feelings instead of against them. Healing happens in relationship—with yourself, with others, with the present moment. You don't have to do this alone.",
      quote: "Your feelings are messengers, not enemies. They're showing you exactly where you need the most compassion."
    },
    Realist: {
      response: "Here's the truth: you're in the messy middle of becoming someone new, and that's supposed to feel uncomfortable. The old you is dying, and the new you hasn't fully emerged yet.",
      fullMessage: "Here's the truth: you're in the messy middle of becoming someone new, and that's supposed to feel uncomfortable. The old you is dying, and the new you hasn't fully emerged yet. This liminal space feels like nothing because it's everything all at once. You're not broken, you're breaking open. You're not lost, you're letting go of the map that no longer leads where you need to go. The disorientation is part of the process. Most people avoid this entirely and stay stuck in patterns that stopped serving them years ago. But you're here, doing the hard work of transformation.",
      quote: "The path isn't unclear because you're lost. It's unclear because you're creating it as you walk."
    },
    Poet: {
      response: "You are a poem still being written, a song in the pause between notes, beauty in the space where one season becomes another.",
      fullMessage: "You are a poem still being written, a song in the pause between notes, beauty in the space where one season becomes another. What feels like emptiness is actually infinite possibility dressed as silence. Your heart is a river that carved canyons through mountains—powerful enough to reshape landscapes, patient enough to work in geological time. The ache you carry is not evidence of breaking but of breakthrough, not of ending but of endless beginning. Even storms are just the sky's way of crying itself clean. You are both the storm and the clearing sky, both the question and the answer blooming wild in its own sweet time.",
      quote: "You are not falling apart. You are falling awake to the poetry that was always living inside you."
    },
    "Best Friend": {
      response: "Bestie, you're literally going through your main character moment right now, and it's giving growth era energy. I'm here for all of it.",
      fullMessage: "Bestie, you're literally going through your main character moment right now, and it's giving growth era energy. I'm here for all of it. Not too much on my friend for feeling all the big feelings—that's just your heart being brave enough to actually live your life instead of just surviving it. You're out here doing the work that most people are too scared to even start, and that's honestly iconic. The plot twists are just making your story more interesting. You're not behind, you're not too much, you're not doing it wrong. You're exactly where you need to be, processing exactly what you need to process, becoming exactly who you're meant to become.",
      quote: "You're not too much for the right people, spaces, and opportunities. You're just enough, at just the right time."
    }
  };

  const fallback = fallbackResponses[archetypeName as keyof typeof fallbackResponses] || fallbackResponses.Mirror;
  const contextualBackground = getContextualBackground(userInput, archetypeName);

  return {
    icon: archetype.icon,
    response: fallback.response,
    fullMessage: fallback.fullMessage,
    quote: fallback.quote,
    tags: ['wisdom', 'growth', 'original', 'profound'],
    backgroundImage: contextualBackground,
    backgroundType: 'contextual-color'
  };
}

export { gemini, geminiModel }; 