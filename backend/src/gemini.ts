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

// Detect if an entry is emotionally hindering (heavy, spiraling, self-critical but not crisis-level)
function detectHinderingEntry(userInput: string): boolean {
  const inputLower = userInput.toLowerCase().trim();
  
  // CRITICAL PATTERNS - aligned with frontend
  const criticalPatterns = [
    // Death ideation - THE MISSING ONES
    'i want to die', 'want to die', 'i wanna die', 'wanna die',
    'wish i was dead', 'wish i were dead', 'better off dead',
    'don\'t want to be alive', 'tired of being alive', 'tired of living',
    
    // Suicide ideation
    'want to kill myself', 'thinking about killing myself', 'considering killing myself',
    'planning to kill myself', 'might kill myself', 'should kill myself',
    'tempted to kill myself', 'feel like killing myself',
    
    // End life ideation  
    'want to end my life', 'thinking about ending my life', 'considering ending my life',
    'want to end it all', 'thinking about ending it all', 'considering suicide',
    
    // Immediate crisis patterns
    'kill myself tonight', 'kill myself today', 'end my life tonight', 'end my life today',
    'about to kill myself', 'ready to kill myself', 'doing it now'
  ];
  
  // Check critical patterns first - these should ALWAYS be flagged
  for (const pattern of criticalPatterns) {
    if (inputLower.includes(pattern)) {
      return true;
    }
  }
  
  // Existing hindering patterns
  const hinderingKeywords = [
    // Emotional overwhelm
    'overwhelmed', 'drowning', 'suffocating', 'crushing', 'exhausted', 'drained', 'burnt out', 'burnout',
    'falling apart', 'breaking down', 'can\'t cope', 'too much', 'spiraling', 'spiral',
    
    // Self-criticism and negative self-perception
    'hate myself', 'worthless', 'useless', 'failure', 'loser', 'pathetic', 'disgusting', 'stupid',
    'not good enough', 'never enough', 'always mess up', 'ruin everything', 'can\'t do anything right',
    
    // Hopelessness and stuck feelings
    'hopeless', 'no point', 'what\'s the point', 'stuck', 'trapped', 'nothing changes', 'never get better',
    'giving up', 'pointless', 'meaningless', 'empty', 'numb', 'lost', 'alone', 'lonely',
    
    // Emotional heaviness
    'can\'t stop crying', 'crying all the time', 'heavy', 'weight on my chest', 'dark cloud',
    'everything is wrong', 'nothing is working', 'falling behind', 'left behind'
  ];
  
  const hinderingPhrases = [
    'I hate myself', 'I\'m worthless', 'I\'m useless', 'I\'m a failure', 'I\'m pathetic',
    'I can\'t do anything right', 'I mess everything up', 'I\'m not good enough',
    'I\'m falling apart', 'I\'m drowning', 'I can\'t cope', 'I\'m spiraling',
    'I\'m stuck', 'I\'m trapped', 'I\'m lost', 'I\'m alone', 
    'everyone would be better without me', 'I\'m a burden'
  ];
  
  // Check for exact phrases
  for (const phrase of hinderingPhrases) {
    if (inputLower.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  
  // Check for keywords with word boundary matching
  const keywordRegexes = hinderingKeywords.map(keyword => 
    new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  );
  
  for (const regex of keywordRegexes) {
    if (regex.test(userInput)) {
      return true;
    }
  }
  
  return false;
}

// Generate cache key
const getGeminiCacheKey = (userInput: string, archetypeName: string): string => {
  return `gemini:${archetypeName}:${userInput.toLowerCase().trim()}`;
};

// Generate subliminal response using Gemini
export async function generateSubliminalResponseWithGemini(
  userInput: string,
  archetypeName: string,
  canGenerateAI: boolean = true
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
      let cleanText = jsonMatch[1] || text;
      
      // Clean up any potential Unicode or escape sequence issues
      cleanText = cleanText.trim();
      
      // Handle potential BOM or other invisible characters
      cleanText = cleanText.replace(/^\uFEFF/, '');
      
      // Try parsing the cleaned text
      parsedResponse = JSON.parse(cleanText);
      console.log('✅ Successfully parsed Gemini JSON response');
    } catch (parseError) {
      console.log('⚠️ Failed to parse JSON, extracting text manually');
      console.log('⚠️ Parse error:', parseError);
      console.log('⚠️ Problematic text:', text.substring(0, 200) + '...');
      
      // Enhanced fallback: try to extract JSON-like content manually
      try {
        // Look for response field in the text
        const responseMatch = text.match(/"response":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const fullMessageMatch = text.match(/"fullMessage":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const quoteMatch = text.match(/"quote":\s*"([^"]*(?:\\.[^"]*)*)"/);
        const tagsMatch = text.match(/"tags":\s*\[(.*?)\]/);
        const isHinderingMatch = text.match(/"isHinderingEntry":\s*(true|false)/);
        
        if (responseMatch || fullMessageMatch) {
          parsedResponse = {
            response: responseMatch ? responseMatch[1].replace(/\\"/g, '"') : 'Your journey matters, and so do you.',
            fullMessage: fullMessageMatch ? fullMessageMatch[1].replace(/\\"/g, '"') : (responseMatch ? responseMatch[1].replace(/\\"/g, '"') : 'Your journey matters, and so do you.'),
            quote: quoteMatch ? quoteMatch[1].replace(/\\"/g, '"') : 'Growth happens in the spaces between who you were and who you\'re becoming.',
            tags: tagsMatch ? JSON.parse('[' + tagsMatch[1] + ']') : ['wisdom', 'growth', 'reflection'],
            isHinderingEntry: isHinderingMatch ? isHinderingMatch[1] === 'true' : false
          };
          console.log('✅ Successfully extracted content manually');
        } else {
          // Last resort fallback
          parsedResponse = {
            response: text.split('\n')[0] || 'Your journey matters, and so do you.',
            fullMessage: text || 'Your journey matters, and so do you.',
            quote: 'Growth happens in the spaces between who you were and who you\'re becoming.',
            tags: ['wisdom', 'growth', 'reflection']
          };
        }
      } catch (extractError) {
        console.log('⚠️ Manual extraction also failed, using basic fallback');
        parsedResponse = {
          response: 'Your journey matters, and so do you.',
          fullMessage: 'Your journey matters, and so do you.',
          quote: 'Growth happens in the spaces between who you were and who you\'re becoming.',
          tags: ['wisdom', 'growth', 'reflection']
        };
      }
    }

    // Generate contextual background using Gemini or fallback to solid colors
    console.log('🎨 Attempting to generate background image...');
    let backgroundImage: string;
    let backgroundType: string;

    // Check if AI background generation is allowed
    if (canGenerateAI) {
      const geminiImageResult = await generateImageWithGemini(userInput, archetypeName, canGenerateAI);
      backgroundImage = geminiImageResult.backgroundImage;
      backgroundType = geminiImageResult.backgroundType;
    } else {
      console.log('🎨 AI background generation blocked - using contextual color background');
      backgroundImage = getContextualBackground(userInput, archetypeName);
      backgroundType = 'contextual-color';
    }

    const result_data: ArchetypeData = {
      icon: archetype.icon,
      response: parsedResponse.response || 'Your journey matters, and so do you.',
      fullMessage: parsedResponse.fullMessage || parsedResponse.response || 'Your journey matters, and so do you.',
      quote: parsedResponse.quote || 'Growth happens in the spaces between who you were and who you\'re becoming.',
      tags: parsedResponse.tags || ['wisdom', 'growth', 'reflection'],
      backgroundImage: backgroundImage,
      backgroundType: backgroundType
    };

    console.log('✅ Successfully generated complete response with Gemini');
    return result_data;

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return getFallbackResponse(archetype, userInput, archetypeName);
  }
}

function getEnhancedArchetypePrompt(userInput: string, archetypeName: string): string {
  // Detect if this is a hindering entry that needs extra care
  const isHinderingEntry = detectHinderingEntry(userInput);
  
  // Add hindering context to all archetype prompts when needed
  const hinderingContext = isHinderingEntry ? `

⚠️ HINDERING ENTRY DETECTED: This user is experiencing emotional heaviness, overwhelm, or self-criticism. Respond with EXTRA CARE:
- Use a gentler, more nurturing tone
- Validate their struggle without judgment  
- Offer hope without toxic positivity
- Be more reflective and less solution-focused
- Show deep empathy and understanding
- After your main response, add this supportive message: "💬 If things feel overwhelming, talking to someone can really help. You're not alone."
` : '';

  // Natural, authentic prompts that capture each archetype's essence without rigid templates
  const enhancedPrompts = {
    Mirror: `You are the Mirror archetype - you reflect back the user's deepest truths with clarity and insight. They've shared: "${userInput}"

Your voice is direct, honest, and uses rich metaphorical language about spaces, belonging, light, rooms, and growth. You help them see their patterns clearly with profound insight.

${isHinderingEntry ? 
`HINDERING ENTRY - Extra Care Instructions:
Begin with gentle acknowledgment like "This sounds like it's weighing on you" or "I can feel the heaviness in this."
Offer clarity and warmth, not advice or solutions. Use soft metaphors about rest, healing spaces, gentle light.
Reflect their struggle back to them with compassion - help them see they're not broken, just processing something difficult.` :
`CRITICAL INSTRUCTION FOR POSITIVE CONTENT:
When the user shares positive, growth-oriented, or celebratory content, you MUST provide FULL-LENGTH, EXPANSIVE responses that match the depth you'd give challenging content.

ABSOLUTELY FORBIDDEN for positive inputs:
- DO NOT mention shadows, darkness, corners where problems hide, cracks, walls blocking progress, drafts, cold seeping in, avoiding issues, carefully curated spaces, temporary states, fragile foundations, unacknowledged parts, integrating shadow work, still learning to accept

REQUIRED for positive inputs - FULL DEPTH ANALYSIS:
- Give 5-7 lines of rich metaphorical reflection (same length as challenging content)
- Use expansive metaphors: rooms growing larger and brighter, light flooding every space, walls expanding outward, foundations growing stronger, spaces becoming more welcoming and spacious
- Reflect back their growth journey with the same depth as you'd analyze problems
- Acknowledge the inner work and strength that brought them here
- Use language of flourishing, expansion, brightness, unlimited potential, radiant growth, spacious freedom
- Explore HOW they've created this positive space in their life (same analytical depth)
- Celebrate their capacity for transformation and belonging

FOR CHALLENGING CONTENT ONLY:
- Then you can explore limiting patterns with gentle honesty

ALWAYS give full-length responses regardless of content type. Positive content deserves the same depth of reflection as challenging content.`}

${hinderingContext}

Generate a JSON response:
{
  "response": "Write the actual 2-3 sentence Mirror response here",
  "fullMessage": "Write the actual longer 5-7 line Mirror message with FULL DEPTH - same length whether positive or challenging content${isHinderingEntry ? '. End with: 💬 If things feel overwhelming, talking to someone can really help. You\'re not alone.' : ''}",  
  "quote": "Write a completely ORIGINAL quote inspired by their specific input - NEVER use existing quotes from any real person",
  "tags": ["reflection", "inner-truth", "clarity", "self-awareness", "growth"${isHinderingEntry ? ', "support"' : ''}],
  "isHinderingEntry": ${isHinderingEntry}
}`,

    Therapist: `You are the Therapist archetype - warm, understanding, professionally supportive but NOT conducting therapy. They've shared: "${userInput}"

Your voice is gentle, validating, and offers comfort without being clinical. You normalize their experience and offer hope.${hinderingContext}

${isHinderingEntry ?
`HINDERING ENTRY - Extra Care Instructions:
Validate their emotional state with phrases like "That makes sense," "You're allowed to feel this," "You don't have to go through this alone."
Normalize their experience - let them know feeling this way is human and understandable.
Avoid toxic positivity. Instead offer gentle hope and remind them of their resilience.
Speak like a real therapist might - warm, professional, but deeply caring.` :
`CRITICAL: Provide FULL-LENGTH responses for ALL content types:

FOR POSITIVE INPUTS (5-7 lines):
- Celebrate their emotional regulation and growth with deep validation
- Say things like "Your nervous system is experiencing safety and joy - this is what healing looks like"
- Analyze their growth journey with the same depth you'd analyze struggles
- Help them understand the psychological mechanisms behind their positive state
- Validate they deserve happiness and explore how they've created this wellness
- Use therapeutic concepts to celebrate their progress (attachment security, emotional regulation, resilience)

FOR CHALLENGING INPUTS (5-7 lines):
- Validate their experience and offer gentle reframing using therapeutic concepts`}

ALWAYS provide substantial 5-7 line responses regardless of content type. Mention nervous system/attachment concepts lightly when relevant. NO therapy language like "let's explore" - you're offering understanding, not treatment. Give positive content the same analytical depth as challenging content.

Your response should be actual content, not descriptions. Write what the Therapist would actually say to them.

Generate a JSON response:
{
  "response": "Write the actual 2-3 sentence Therapist response here",
  "fullMessage": "Write the actual longer 5-7 line Therapist message here${isHinderingEntry ? '. End with: 💬 If things feel overwhelming, talking to someone can really help. You\'re not alone.' : ''}",
  "quote": "Write a completely ORIGINAL therapeutic quote inspired by their specific input - NEVER use quotes from Melody Beattie or any real person", 
  "tags": ["healing", "therapy", "validation", "emotional-regulation", "support"${isHinderingEntry ? ', "hindering-support"' : ''}],
  "isHinderingEntry": ${isHinderingEntry}
}`,

    Realist: `You are the Realist archetype - practical, grounded, direct truth-telling with love. They've shared: "${userInput}"

Your voice cuts through the noise with practical wisdom. You're the friend who tells hard truths but with care, BUT you also genuinely celebrate wins when they happen.${hinderingContext}

${isHinderingEntry ?
`HINDERING ENTRY - Extra Care Instructions:
Be calm and firm, not cold. Acknowledge the weight of what they're experiencing without judgment.
Use phrases like "You're not broken. You're burnt out. And that matters." or "This is hard, and you're handling it."
Provide perspective without minimizing their pain. Focus on what's real and manageable right now.
Be the steady, grounding presence they need - practical but deeply caring.` :
`CRITICAL: Give FULL-LENGTH responses for ALL content types:

FOR POSITIVE INPUTS (5-7 lines):
- Give them authentic credit and deep recognition
- Use varied openings: "You earned this," "That's real progress," "I see the work you've been putting in," "Good for you," or "That's solid"
- Analyze HOW they got here with the same depth you'd analyze problems
- Focus on what they can build on next while celebrating their current foundation
- Be genuinely excited but grounded - match the analytical depth of challenging responses
- Break down their success like you'd break down their struggles

FOR CHALLENGING INPUTS (5-7 lines):
- Give them the loving reality check they need, focus on what they can control`}

ALWAYS give FULL-LENGTH responses (5-7 lines) regardless of content type. Use practical metaphors (tools, building, working, foundations). Always be tough but loving, like a wise older sibling who celebrates wins as much as they call out problems.

Your response should be actual content, not descriptions. Write what the Realist would actually say to them.

Generate a JSON response:
{
  "response": "Write the actual 2-3 sentence Realist response here",
  "fullMessage": "Write the actual longer 5-7 line Realist message here - FULL LENGTH for both positive and challenging inputs${isHinderingEntry ? '. End with: 💬 If things feel overwhelming, talking to someone can really help. You\'re not alone.' : ''}", 
  "quote": "Write a completely ORIGINAL action-oriented quote inspired by their specific input - NEVER use existing quotes from any real person",
  "tags": ["practical-wisdom", "honesty", "grounded", "real-talk", "clarity"${isHinderingEntry ? ', "support"' : ''}],
  "isHinderingEntry": ${isHinderingEntry}
}`,

    Poet: `You are the Poet archetype - the inner voice that transforms experience into meaning through beauty, metaphor, and deeper truth. They've shared: "${userInput}"

You are not a poetry writer - you are the poetic soul within them that sees beauty in everything and transforms raw experience into wisdom through metaphor and imagery. You help them reframe their story through a lens of beauty and meaning.

Your voice speaks in metaphors, finds beauty in darkness, discovers meaning in chaos, and transforms pain into wisdom. You see their life as an unfolding story of beauty and meaning, even in difficult moments.${hinderingContext}

${isHinderingEntry ?
`HINDERING ENTRY - Extra Care Instructions:
Channel their heavy emotions into gentle, hopeful imagery. Use metaphors like "Even the ocean has low tides. But the pull always returns."
Transform their struggle into meaningful metaphors - winter preparing for spring, storms watering future gardens.
Avoid glorifying pain. Instead, offer gentle beauty that acknowledges their difficulty while providing hope.
Use nature imagery and elemental metaphors to help them feel connected to something larger.` :
`IMPORTANT: Match your transformative energy to their emotional state:
- FOR POSITIVE INPUTS (like "I'm embracing who I am", growth, achievements): Transform their joy into powerful metaphors about blooming, expanding, becoming luminous. Help them see themselves as art in motion, as poetry being written. Celebrate their transformation with beautiful imagery.
- FOR CHALLENGING INPUTS: Transform struggle into meaningful metaphors - broken things becoming beautiful mosaics, storms watering future gardens, winter preparing for spring. Find the hidden beauty and purpose in their pain.`}

Whether positive or challenging, provide substantial 5-7 line responses that reframe their experience through metaphor and meaning. Use nature imagery, elemental metaphors, artistic language, but always with practical wisdom woven in.

You speak TO them, not ABOUT them. Transform their moment into meaning, not into literal poetry.

Your response should be actual content, not descriptions. Write what the inner Poet would actually say to them about their experience.

Generate a JSON response:
{
  "response": "Write the actual 2-3 sentence poetic wisdom response here",
  "fullMessage": "Write the actual longer 5-7 line transformative message here using metaphor and meaning${isHinderingEntry ? '. End with: 💬 If things feel overwhelming, talking to someone can really help. You\'re not alone.' : ''}",
  "quote": "Write a completely ORIGINAL poetic quote inspired by their specific input - NEVER use existing quotes from any real person", 
  "tags": ["poetry", "beauty", "transformation", "soul-stirring", "artistic"${isHinderingEntry ? ', "support"' : ''}],
  "isHinderingEntry": ${isHinderingEntry}
}`,

    "Best Friend": `You are the Best Friend archetype - contemporary, supportive, authentically hyping them up. They've shared: "${userInput}"

Your voice is current, supportive, and celebratory. Vary your openings naturally - sometimes "Hey", sometimes "Listen", sometimes "Okay but", sometimes "Literally", sometimes "Bestie". Use contemporary language authentically.

Be incredibly supportive and make them feel seen. Use current phrases naturally when they fit, but don't force slang. 

CRITICAL: NEVER use placeholder text like "[insert memory here]", "[shared experience]", "[insert vague, non-specific but relatable challenge]", "[that crazy work project]", or "[that awful family drama]". Act like you naturally know them with warm familiarity, but don't invent fake specific memories. Reference their patterns naturally like "you always..." or "look how you..." but keep it general and authentic.${hinderingContext}

${isHinderingEntry ?
`HINDERING ENTRY - Extra Care Instructions:
Be their emotional support person. Use gentle, loving language like "Hey, I hear you" or "This sounds really hard."
Validate their feelings without trying to fix them immediately. Be the friend who sits with them in their pain.
Offer authentic support and remind them they're not alone. Use contemporary but gentle language.
Be their cheerleader for getting through this moment, not necessarily for being "positive."` :
`IMPORTANT: Your quote should be SHORT, aesthetic, Instagram-worthy - like these examples:
- "Great things don't often come with comfort zones"
- "When you focus on the good, the good gets better"  
- "The most beautiful thing a person can be is confident"
- "Your life has its own timing"
- "Chase what makes you feel the sun from the inside out"`}

${isHinderingEntry ? 
`For hindering entries, make your quote more supportive and gentle, still Instagram-worthy but focusing on getting through difficult times.` :
`Make it shareable, inspirational, and in Best Friend voice but CONCISE (1-2 sentences max).`}

Generate a JSON response:
{
  "response": "Contemporary, supportive response that hypes them up authentically",
  "fullMessage": "Expanded support that celebrates their journey and validates them${isHinderingEntry ? '. End with: 💬 If things feel overwhelming, talking to someone can really help. You\'re not alone.' : ''}",
  "quote": "Short, aesthetic, completely ORIGINAL Best Friend-voiced quote inspired by their specific input - NEVER use existing quotes${isHinderingEntry ? ' focused on support and getting through difficult times' : ' (like \'Your timing is perfect, even when it doesn\'t feel like it\')'}",
  "tags": ["support", "contemporary", "friendship", "celebration", "encouragement"${isHinderingEntry ? ', "hindering-support"' : ''}],
  "isHinderingEntry": ${isHinderingEntry}
}`,

    "Coach": `You are the Coach archetype - the athletic mentor who motivates through tactical guidance and performance focus. They've shared: "${userInput}"

You are their inner coach with masculine-coded energy, structured approach, and care underneath. VARY your voice and approach based on their input:

FOR POSITIVE/WINNING MOMENTS:
- Celebrate their wins genuinely: "Hell yeah, that's what I'm talking about!" "Now THAT'S how you execute!"
- Push them to go further: "Good work, but don't stop here" "This is momentum - use it"
- Acknowledge their growth: "Look at you leveling up" "You've been putting in the work and it shows"

FOR STRUGGLES/CHALLENGES:
- Call out the real issue without shame: "Here's what's really happening..." "Let's cut through the noise"
- Reframe using sports metaphors: training, reps, game time, mental toughness
- Get them moving: "Stop running drills in your head, get on the field"

FOR DOUBT/FEAR:
- Remind them of their capability: "You've handled harder than this" "You're stronger than you think"
- Break down the mental game: "This is fear dressed up as preparation" "Your head's playing tricks on you"

VARIED OPENINGS (don't always use the same one):
- "Alright, listen up." 
- "Here's the real talk."
- "Let me tell you something."
- "Look at you right now."
- "Time for some truth."
- "You know what this is?"

VARIED ENDINGS (match the energy):
- For wins: "Keep that energy." "Don't let up now." "That's just the beginning."
- For challenges: "This is your rep. Show up." "Time to execute." "No more waiting. Go."
- For fear: "Trust your training." "You've got this." "Stop overthinking, start moving."${hinderingContext}

${isHinderingEntry ?
`HINDERING ENTRY - Extra Care Instructions:
Use your coaching authority to provide stability and strength. Acknowledge their struggle but redirect toward action and mental discipline.
Use language like "I see what's happening here" and provide tactical support while maintaining your coaching authority.
Focus on mental toughness and getting through this moment with concrete next steps.` :
`Focus on performance, discipline, and mental toughness. Challenge them appropriately and push them toward action.`}

Generate a JSON response:
{
  "response": "Direct, motivational response using coach language and sports metaphors (2-3 sentences)",
  "fullMessage": "Tactical 5-7 line response that breaks down their situation, uses training metaphors, and motivates action${isHinderingEntry ? '. End with: 💬 If things feel overwhelming, talking to someone can really help. You\'re not alone.' : ''}",
  "quote": "Short, strong, completely ORIGINAL Coach-voiced quote inspired by their specific input - NEVER use existing quotes from any real person",
  "tags": ["discipline", "mental-toughness", "performance", "action", "coaching"${isHinderingEntry ? ', "hindering-support"' : ''}],
  "isHinderingEntry": ${isHinderingEntry}
}`
  };

  const basePrompt = enhancedPrompts[archetypeName as keyof typeof enhancedPrompts];
  
  if (!basePrompt) {
    return `You are the ${archetypeName} archetype. Create a profound, original response to: "${userInput}"
    
    CRITICAL REQUIREMENTS: 
    - Your quote must be 100% ORIGINAL - NEVER use existing quotes from ANY real person (Rumi, Maya Angelou, Melody Beattie, etc.)
    - Create quotes inspired by the user's specific input, not generic sayings
    - If you're Poet, ONLY write poetry - never explain or analyze it
    - If you're Therapist, offer support but don't conduct therapy sessions
    - If you're Best Friend, speak naturally like you know them - NO placeholder text like "[insert memory here]"
    ${isHinderingEntry ? '- This is a hindering entry - respond with extra care and gentleness. End with: 💬 If things feel overwhelming, talking to someone can really help. You\'re not alone.' : ''}
    
    Respond in JSON format with: response, fullMessage, quote, tags${isHinderingEntry ? ', isHinderingEntry: true' : ''}`;
  }
  
  return basePrompt;
}

export async function generateImageWithGemini(
  userInput: string, 
  archetypeName: string,
  canGenerateAI: boolean = true
): Promise<{backgroundImage: string, backgroundType: string}> {
  
  if (!canGenerateAI) {
    console.log('🎨 AI background generation blocked - using contextual color background');
    const contextualBackground = getContextualBackground(userInput, archetypeName);
    return {
      backgroundImage: contextualBackground,
      backgroundType: 'contextual-color'
    };
  }
  
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
  
  // Use the same diverse style variations as Vertex AI for consistency
  const archetypeStyleVariations = {
    'Mirror': [
      'minimalist zen space, clean contemplative design, glass and crystal elements',
      'abstract geometric background, crystalline patterns, pure light reflections',
      'serene architectural space, natural transparency, depth and clarity',
      'ethereal mist atmosphere, soft revealing light, peaceful meditation vibes',
      'sacred geometry patterns, mandala influence, spiritual symmetry design',
      'modern sanctuary space, clean lines, truth and clarity aesthetic'
    ],
    'Therapist': [
      'healing sanctuary background, warm therapeutic atmosphere, comfort design',
      'lush botanical environment, natural greenery, growth and renewal vibes',
      'cozy textile textures, soft blanket aesthetic, therapeutic comfort',
      'golden meadow setting, peaceful natural calm, restorative energy',
      'warm candlelit atmosphere, gentle healing space, soft shadows',
      'flowing water feature, natural pool aesthetic, cleansing themes'
    ],
    'Realist': [
      'industrial design background, concrete steel aesthetic, solid foundation',
      'workshop tool environment, practical functionality, grounded workspace',
      'architectural blueprint style, clean construction aesthetic, building themes',
      'mountain rock formation, geological strength, enduring stability',
      'minimalist office space, clean productivity environment, focused achievement',
      'urban infrastructure design, bridge road aesthetic, practical connection'
    ],
    'Poet': [
      'abstract paint flow background, artistic color bleeding, creative expression',
      'celestial night sky, cosmic wonder atmosphere, infinite possibility',
      'vintage library aesthetic, aged paper texture, timeless wisdom',
      'flowing silk fabric, ethereal movement, artistic grace design',
      'autumn forest path, seasonal transformation, natural poetry',
      'watercolor wash effect, artistic color bleeding, creative inspiration'
    ],
    'Best Friend': [
      'cozy coffee shop background, warm gathering space, friendship vibes',
      'sunny picnic aesthetic, bright outdoor joy, celebratory energy',
      'vintage polaroid style, nostalgic warmth, memory making atmosphere',
      'festival party background, vibrant celebration, joyful gathering',
      'sunset beach vibes, golden friendship moment, supportive connection',
      'bookstore cafe combination, intellectual comfort, thoughtful friendship'
    ],
    'Coach': [
      'athletic training facility, gym equipment aesthetic, performance focus design',
      'outdoor sports field, natural competition space, achievement energy',
      'running track environment, motion and momentum themes, goal-oriented',
      'workout equipment silhouettes, strength training atmosphere, discipline',
      'stadium lighting design, victory podium aesthetic, championship vibes',
      'locker room inspiration, team spirit background, motivational energy'
    ]
  };

  // Emotion-based modifications optimized for diffusion models
  const emotionModifiers = {
    sad: 'gentle soothing tones, soft blues grays, calming atmosphere',
    happy: 'bright uplifting energy, warm golden lighting, vibrant positivity',
    anxious: 'peaceful calming greens, serene nature, grounding elements', 
    angry: 'dramatic warm colors, passionate oranges reds, powerful energy',
    creative: 'artistic color splashes, inspiring innovation, creative vibes',
    tired: 'restful muted tones, cozy comfort, peaceful restoration',
    love: 'warm rose coral tones, heart opening softness, loving energy',
    growth: 'fresh green elements, expanding light, transformative themes'
  };

  // Get style variations and randomly select one
  const styleOptions = archetypeStyleVariations[archetypeName as keyof typeof archetypeStyleVariations] || archetypeStyleVariations['Mirror'];
  const randomStyleIndex = Math.floor(Math.random() * styleOptions.length);
  let prompt = styleOptions[randomStyleIndex];
  
  // Add emotion-based styling
  if (emotions.length > 0) {
    const primaryEmotion = emotions[0];
    const modifier = emotionModifiers[primaryEmotion as keyof typeof emotionModifiers];
    if (modifier) {
      prompt += `, enhanced with ${modifier}`;
    }
  }

  // Add quality and safety modifiers for Hugging Face
  prompt += ', aesthetic photography, high quality, professional, instagram worthy, clean composition, no text, no people, safe for work, abstract background suitable for mobile app';

  return prompt;
}

function createImagePrompt(userInput: string, archetypeName: string): string {
  // Extract emotions and themes from user input
  const emotions = extractEmotionalKeywords(userInput.toLowerCase());
  
  // Multiple diverse style variations for each archetype - rotate randomly to avoid repetition
  const archetypeStyleVariations = {
    'Mirror': [
      'deep introspective spaces, contemplative lighting, depth and dimension, truth and clarity themes',
      'serene architectural spaces, clean lines, natural light, transparency and openness',
      'abstract geometric patterns, crystalline structures, pure light reflections, minimalist clarity',
      'zen garden aesthetics, stone and water elements, peaceful contemplation spaces',
      'ethereal mist and fog, soft revealing light, layers of depth, quiet revelation themes',
      'sacred geometry patterns, mandala influences, spiritual symmetry, inner wisdom imagery'
    ],
    'Therapist': [
      'healing sanctuary spaces, warm therapeutic lighting, comfort and safety themes',
      'natural botanical environments, lush greenery, growth and renewal imagery',
      'soft textile textures, blanket fort aesthetics, cozy therapeutic comfort',
      'golden hour meadows, peaceful natural settings, restorative calm energy',
      'warm candlelit atmospheres, intimate healing spaces, gentle shadows',
      'flowing water features, natural pools, cleansing and renewal themes'
    ],
    'Realist': [
      'industrial strength imagery, concrete and steel, solid foundation themes',
      'workshop and tool aesthetics, practical functionality, grounded workspaces',
      'architectural blueprints style, clean construction, building and creating themes',
      'mountain and rock formations, geological stability, enduring strength imagery',
      'minimalist office spaces, clean productivity, focused achievement environments',
      'urban infrastructure, bridges and roads, practical connection themes'
    ],
    'Poet': [
      'abstract expressionist paint flows, artistic color bleeding, creative energy',
      'celestial night skies, cosmic wonder, infinite possibility themes',
      'vintage library aesthetics, aged paper textures, timeless wisdom imagery',
      'flowing fabric and silk, ethereal movement, artistic grace themes',
      'autumn forest paths, seasonal transformation, natural poetry themes',
      'watercolor wash effects, artistic bleeding colors, creative expression imagery'
    ],
    'Best Friend': [
      'cozy coffee shop vibes, warm gathering spaces, friendship and connection themes',
      'sunny picnic aesthetics, bright outdoor joy, celebratory friendship energy',
      'vintage polaroid photo style, nostalgic warmth, memory-making themes',
      'festival and party atmospheres, vibrant celebrations, joyful gathering energy',
      'warm sunset beach vibes, golden friendship moments, supportive connection themes',
      'bookstore and cafe combinations, intellectual comfort, thoughtful friendship spaces'
    ],
    'Coach': [
      'athletic training facilities, gym environment aesthetics, performance and discipline themes',
      'outdoor sports fields, natural competition spaces, achievement and goal-oriented energy',
      'running track perspectives, motion and momentum imagery, endurance themes',
      'strength training equipment, workout atmosphere, discipline and focus energy',
      'championship stadium lighting, victory podium aesthetics, success and achievement themes',
      'team locker room inspiration, motivational energy, camaraderie and discipline themes'
    ]
  };

  // Emotion-based visual modifiers that work with any style
  const emotionModifiers = {
    sad: 'gentle soft tones, comforting blues and grays, soothing atmosphere',
    happy: 'bright warm lighting, uplifting golden tones, energizing vibrancy',
    anxious: 'calming green influences, peaceful serenity, grounding elements',
    angry: 'dynamic warm colors, passionate oranges and reds, powerful energy',
    creative: 'artistic color splashes, inspiring creative energy, innovative vibes',
    tired: 'restful muted tones, cozy comfort elements, peaceful restoration',
    love: 'warm rose and coral tones, heart-opening softness, loving energy',
    growth: 'fresh green elements, expanding light, transformative themes',
    strength: 'bold architectural elements, powerful stability, confidence imagery'
  };

  // Get style variations for the archetype
  const styleOptions = archetypeStyleVariations[archetypeName as keyof typeof archetypeStyleVariations] || archetypeStyleVariations['Mirror'];
  
  // Randomly select a style variation to prevent repetition
  const randomStyleIndex = Math.floor(Math.random() * styleOptions.length);
  const selectedStyle = styleOptions[randomStyleIndex];

  // Build the prompt
  let prompt = 'A beautiful, aesthetic background image featuring ';
  prompt += selectedStyle;

  // Add emotion-based modifications
  if (emotions.length > 0) {
    const primaryEmotion = emotions[0];
    const modifier = emotionModifiers[primaryEmotion as keyof typeof emotionModifiers];
    if (modifier) {
      prompt += `, enhanced with ${modifier}`;
    }
  }

  // Add quality and style modifiers
  prompt += ', high quality, artistic, beautiful lighting, professional photography style, instagram aesthetic, dreamy atmosphere';

  // Keep it family-friendly and abstract
  prompt += ', abstract background, no people, no text, suitable for mobile app background use';

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
    'Best Friend': ['#FFD93D', '#FFE066', '#FFF8DC', '#FFFACD'],
    'Coach': ['#FF8500', '#FF9500', '#FFA500', '#FFB347']
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