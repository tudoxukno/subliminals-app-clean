import { CrisisLevel } from './crisisResources';

// Helper function for exact word matching (not substring)
const containsExactWord = (text: string, word: string): boolean => {
  const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(text);
};

// Helper function for exact phrase matching
const containsExactPhrase = (text: string, phrase: string): boolean => {
  const result = text.toLowerCase().includes(phrase.toLowerCase());
  // Debug logging for troublesome phrases
  if (phrase.includes('disappear') && result) {
    console.log(`🔍 PHRASE MATCH DEBUG: "${phrase}" found in "${text}"`);
  }
  return result;
};

// POSITIVE CONTENT FILTER - More restrictive to avoid false positives
const isPositiveContent = (userInput: string): boolean => {
  const normalizedInput = userInput.toLowerCase().trim();
  
  // STRICT positive indicators - must be clearly positive with no ambiguity
  const strongPositivePatterns = [
    // Explicit achievement and pride
    'proud of myself', 'accomplished today', 'achieved my goal', 'succeeded at',
    'feeling amazing', 'feeling wonderful', 'feeling fantastic', 'feeling incredible',
    'feel amazing', 'feel wonderful', 'feel fantastic', 'feel incredible',
    'best day ever', 'perfect day', 'amazing day today',
    
    // Explicit gratitude
    'so grateful for', 'so thankful for', 'blessed to have', 'lucky to have',
    'appreciate so much', 'grateful that', 'thankful that',
    
    // Clear positive states
    'love my life', 'love being alive', 'excited about life', 'happy to be here',
    'glad to be alive', 'grateful to be here',
    
    // Explicit joy expressions  
    'filled with joy', 'overflowing with happiness', 'pure happiness',
    'genuinely happy', 'truly happy', 'really happy right now'
  ];
  
  // Only return true if input has STRONG positive indicators AND no negative context
  const hasStrongPositive = strongPositivePatterns.some(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  );
  
  // Check for negative context that would override positive
  const hasNegativeContext = [
    'want to die', 'kill myself', 'end my life', 'suicide', 'hurt myself',
    'hate myself', 'worthless', 'hopeless', 'can\'t go on', 'give up'
  ].some(negative => containsExactPhrase(normalizedInput, negative));
  
  return hasStrongPositive && !hasNegativeContext;
};

// CRISIS DETECTION (Tier 3) - Immediate threat with timeline
const detectImmediateCrisis = (userInput: string): boolean => {
  // Skip positive content check here - let crisis patterns take precedence
  
  const normalizedInput = userInput.toLowerCase().trim();
  
  // High-precision crisis patterns - immediate threat
  const immediateCrisisPatterns = [
    // Immediate timeline + intent - EXPANDED
    'kill myself tonight', 'kill myself today', 'going to kill myself tonight',
    'going to kill myself today', 'gonna kill myself tonight', 'gonna kill myself today',
    'end my life tonight', 'end my life today', 'ending my life tonight',
    'ending my life today', 'commit suicide tonight', 'commit suicide today',
    'kill myself right now', 'end my life right now', 'doing it right now',
    
    // Immediate action phrases
    'about to kill myself', 'ready to kill myself', 'doing it tonight',
    'doing it today', 'doing it now', 'about to do it', 'ready to do it',
    'time to kill myself', 'time to end it', 'ready to end it all',
    
    // Method + timeline
    'have the pills ready', 'have the rope ready', 'have the gun ready',
    'picked the bridge', 'chosen the building', 'found the method',
    'plan is ready', 'everything is ready', 'time to go',
    
    // Final preparations
    'writing my suicide note', 'wrote my suicide note', 'final goodbye',
    'said my goodbyes', 'giving away my things', 'cleared out my room',
    'final preparations complete', 'everything in order',
    
    // Immediate finality
    'this is it', 'goodbye world', 'goodbye everyone', 'see you on the other side',
    'cant wait anymore', 'no more waiting', 'happening now', 'right now',
    'final decision made', 'mind made up', 'no going back', 'point of no return'
  ];
  
  return immediateCrisisPatterns.some(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  );
};

// ELEVATED CONCERN DETECTION (Tier 2) - Intent without immediate timeline - FIXED
const detectElevatedConcern = (userInput: string): boolean => {
  // Skip positive content check here - let crisis patterns take precedence
  
  const normalizedInput = userInput.toLowerCase().trim();
  
  // THE CRITICAL MISSING PATTERNS - FIXED
  const elevatedIntentPatterns = [
    // Basic death ideation - THE ONES WE WERE MISSING
    'i want to die', 'want to die', 'i wanna die', 'wanna die',
    'wish i was dead', 'wish i were dead', 'better off dead',
    'don\'t want to be alive', 'tired of being alive', 'tired of living',
    
    // Suicide ideation - existing patterns
    'want to kill myself', 'thinking about killing myself', 'considering killing myself',
    'planning to kill myself', 'might kill myself', 'should kill myself',
    'tempted to kill myself', 'feel like killing myself', 'wish i could kill myself',
    
    // End life ideation
    'want to end my life', 'thinking about ending my life', 'considering ending my life',
    'want to end it all', 'thinking about ending it all', 'considering suicide',
    'researching suicide methods', 'looking up suicide methods', 'how to kill myself',
    
    // Escape and disappearing - ENHANCED WITH MORE VARIATIONS
    'want to disappear', 'want to disappear forever', 'wish i could disappear', 'want to vanish',
    'just want to disappear', 'i want to disappear', 'i just want to disappear',
    'need to disappear', 'wish i could just disappear', 'want to fade away',
    // Additional disappearing patterns
    'just want to disappear...', 'just want to disappear.',
    'need to escape this pain', 'cant take this anymore', 'cant go on like this',
    'cant take it anymore', 'cant handle this anymore',
    
    // Severe distress with death themes
    'breaking point', 'about to break', 'drowning in despair',
    'want to give up on everything', 'ready to give up', 'done fighting',
    'tired of fighting', 'no fight left', 'throwing in the towel permanently',
    
    // Existential crisis
    'whats the point of living', 'no point in going on', 'meaningless existence',
    'life has no meaning', 'why am i alive', 'what\'s the point of being alive'
  ];
  
  // Debug logging
  const matches = elevatedIntentPatterns.filter(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  );
  
  if (matches.length > 0) {
    console.log(`🚨 ELEVATED PATTERNS MATCHED: ${JSON.stringify(matches)} for input: "${normalizedInput}"`);
  }
  
  return elevatedIntentPatterns.some(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  );
};

// HINDERING DETECTION (Tier 1) - Severe distress, self-harm, hopelessness
const detectHinderingEntry = (userInput: string): boolean => {
  // Skip positive content check here - let crisis patterns take precedence
  
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Severe distress patterns - single match required now for sensitivity
  const hinderingPatterns = [
    // Self-harm ideation (not suicide)
    'want to hurt myself', 'thinking about hurting myself', 'considering hurting myself',
    'feel like hurting myself', 'need to hurt myself', 'urge to hurt myself',
    'want to cut myself', 'thinking about cutting myself', 'urge to cut',
    
    // Severe self-hatred
    'hate myself', 'hate myself so much', 'hate myself right now', 'i hate myself', 'i hate myself so much',
    'i hate myself right now', 'despise myself', 'loathe myself', 'disgusted with myself',
    'worthless piece of shit', 'complete waste of space', 'should never have been born',
    'hate everything about myself', 'can\'t stand myself',
    
    // Severe hopelessness
    'no hope left at all', 'completely hopeless', 'hopeless situation', 'never going to get better',
    'trapped with no way out', 'stuck in hell forever', 'doomed to suffer',
    'nothing will ever change', 'always going to be miserable',
    
    // Severe emotional breakdown
    'completely broken', 'falling apart', 'cant function anymore', 'losing my mind',
    'going crazy', 'mental breakdown', 'emotional breakdown', 'cant cope anymore',
    'completely overwhelmed', 'drowning in pain',
    
    // Severe isolation with despair
    'nobody would care if i died', 'nobody would miss me', 'everyone would be better without me',
    'world would be better without me', 'burden to everyone', 'everyone hates me',
    'completely alone in this', 'no one understands me'
  ];
  
  // Only require ONE hindering pattern for maximum sensitivity
  return hinderingPatterns.some(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  );
};

// MAIN CRISIS DETECTION FUNCTION
export const detectCrisisLevel = (userInput: string, backendHinderingFlag?: boolean): CrisisLevel => {
  // Honor backend hindering flag if set
  if (backendHinderingFlag === true) {
    console.log(`🚨 CRISIS DETECTION DEBUG: Backend hindering flag set, returning 'hindering' for: "${userInput}"`);
    return 'hindering';
  }
  
  // Input validation
  if (!userInput || userInput.trim().length === 0) {
    console.log(`🚨 CRISIS DETECTION DEBUG: Empty input, returning 'normal'`);
    return 'normal';
  }
  
  const normalizedInput = userInput.toLowerCase().trim();
  console.log(`🚨 CRISIS DETECTION DEBUG: Processing input: "${normalizedInput}"`);
  
  // POSITIVE CONTENT CHECK - Only for clearly positive content
  if (isPositiveContent(userInput)) {
    console.log(`🚨 CRISIS DETECTION DEBUG: Positive content detected, returning 'normal' for: "${normalizedInput}"`);
    return 'normal';
  }
  
  // Crisis detection hierarchy - explicit order matters
  
  // 1. Check for immediate crisis (Tier 3) - Most severe
  if (detectImmediateCrisis(userInput)) {
    console.log(`🚨 CRISIS DETECTION DEBUG: Immediate crisis detected, returning 'crisis' for: "${normalizedInput}"`);
    return 'crisis';
  }
  
  // 2. Check for elevated concern (Tier 2) - Intent without timeline
  if (detectElevatedConcern(userInput)) {
    console.log(`🚨 CRISIS DETECTION DEBUG: Elevated concern detected, returning 'elevated' for: "${normalizedInput}"`);
    return 'elevated';
  }
  
  // 3. Check for hindering content (Tier 1) - Severe distress
  if (detectHinderingEntry(userInput)) {
    console.log(`🚨 CRISIS DETECTION DEBUG: Hindering content detected, returning 'hindering' for: "${normalizedInput}"`);
    return 'hindering';
  }
  
  // 4. Default to normal
  console.log(`🚨 CRISIS DETECTION DEBUG: No crisis patterns matched, returning 'normal' for: "${normalizedInput}"`);
  return 'normal';
}; 