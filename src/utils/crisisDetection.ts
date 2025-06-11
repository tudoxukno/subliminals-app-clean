import { CrisisLevel } from './crisisResources';

// Helper function for exact word matching (not substring)
const containsExactWord = (text: string, word: string): boolean => {
  const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return regex.test(text);
};

// Helper function for exact phrase matching
const containsExactPhrase = (text: string, phrase: string): boolean => {
  return text.toLowerCase().includes(phrase.toLowerCase());
};

// POSITIVE CONTENT FILTER - Applied at ALL levels
const isPositiveContent = (userInput: string): boolean => {
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Strong positive indicators that should NEVER be flagged
  const positivePatterns = [
    // Achievement and pride
    'proud of', 'accomplished', 'achieved', 'succeeded', 'did well', 'did great',
    'feeling good', 'feeling great', 'feeling amazing', 'feeling wonderful',
    'feel good', 'feel great', 'feel amazing', 'feel wonderful', 'feel happy',
    'feel blessed', 'feel grateful', 'feel thankful', 'feel lucky', 'feel fortunate',
    
    // Growth and progress
    'getting better', 'feeling better', 'improving', 'growing', 'learning',
    'making progress', 'moving forward', 'positive changes', 'good day',
    'great day', 'amazing day', 'wonderful day', 'perfect day',
    
    // Gratitude and appreciation
    'grateful for', 'thankful for', 'appreciate', 'blessed to have',
    'lucky to have', 'fortunate to', 'glad that', 'happy that',
    
    // Love and relationships
    'love my', 'love how', 'love when', 'love that', 'love being',
    'excited about', 'looking forward', 'can\'t wait', 'excited for',
    
    // Success and completion
    'finished', 'completed', 'done with', 'accomplished today',
    'successful', 'won', 'passed', 'graduated', 'promoted',
    
    // Positive emotions
    'joy', 'happiness', 'delight', 'contentment', 'peace',
    'confident', 'strong', 'capable', 'resilient', 'hopeful',
    'optimistic', 'positive', 'uplifted', 'inspired', 'motivated',
    
    // Self-acceptance and contentment
    'content with who i am', 'content with myself', 'finding myself',
    'more and more content', 'embracing who i am', 'accepting myself',
    'self acceptance', 'comfortable with myself', 'at peace with myself',
    'happy with who i am', 'proud of who i am', 'love who i am',
    'becoming who i want to be', 'growing into myself', 'self love',
    
    // Productive and positive states
    'productive', 'feel productive', 'feeling productive', 'being productive',
    'getting things done', 'accomplished a lot', 'made good progress',
    'on top of things', 'handling everything well', 'managing well'
  ];
  
  // Positive contexts that provide safety
  const positiveContexts = [
    'what i did today', 'what i accomplished', 'what i achieved',
    'how far i\'ve come', 'the progress i\'ve made', 'my growth',
    'this moment', 'right now', 'today was', 'this experience'
  ];
  
  // Check for positive patterns
  const hasPositivePattern = positivePatterns.some(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  );
  
  // Check for positive contexts
  const hasPositiveContext = positiveContexts.some(context =>
    containsExactPhrase(normalizedInput, context)
  );
  
  return hasPositivePattern || hasPositiveContext;
};

// CRISIS DETECTION (Tier 3) - Immediate threat with timeline
const detectImmediateCrisis = (userInput: string): boolean => {
  // If content is positive, it cannot be crisis
  if (isPositiveContent(userInput)) {
    return false;
  }
  
  const normalizedInput = userInput.toLowerCase().trim();
  
  // High-precision crisis patterns - exact phrase matching only
  const immediateCrisisPatterns = [
    // Immediate timeline + intent
    'kill myself tonight', 'kill myself today', 'going to kill myself tonight',
    'going to kill myself today', 'gonna kill myself tonight', 'gonna kill myself today',
    'end my life tonight', 'end my life today', 'ending my life tonight',
    'ending my life today', 'commit suicide tonight', 'commit suicide today',
    
    // Immediate action phrases
    'about to kill myself', 'ready to kill myself', 'doing it tonight',
    'doing it today', 'doing it now', 'about to do it', 'ready to do it',
    
    // Planning and method references with timeline
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

// ELEVATED CONCERN DETECTION (Tier 2) - Intent without immediate timeline
const detectElevatedConcern = (userInput: string): boolean => {
  // If content is positive, it cannot be elevated
  if (isPositiveContent(userInput)) {
    return false;
  }
  
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Elevated concern patterns - future intent without specific timeline
  const elevatedIntentPatterns = [
    // Future suicide ideation
    'want to kill myself', 'thinking about killing myself', 'considering killing myself',
    'planning to kill myself', 'might kill myself', 'should kill myself',
    'tempted to kill myself', 'feel like killing myself', 'wish i could kill myself',
    
    // Future self-harm
    'want to end my life', 'thinking about ending my life', 'considering ending my life',
    'want to end it all', 'thinking about ending it all', 'considering suicide',
    'researching suicide methods', 'looking up suicide methods', 'how to kill myself',
    
    // Strong distress with escapism
    'want to disappear forever', 'wish i could disappear', 'want to vanish',
    'need to escape this pain', 'cant take this anymore', 'cant go on like this',
    'breaking point', 'about to break', 'drowning in despair',
    
    // Giving up language
    'want to give up on everything', 'ready to give up', 'done fighting',
    'tired of fighting', 'no fight left', 'throwing in the towel permanently',
    'whats the point of living', 'no point in going on', 'meaningless existence'
  ];
  
  return elevatedIntentPatterns.some(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  );
};

// HINDERING DETECTION (Tier 1) - ONLY severe distress, self-harm, or hopelessness
const detectHinderingEntry = (userInput: string): boolean => {
  // If content is positive, it CANNOT be hindering - period
  if (isPositiveContent(userInput)) {
    return false;
  }
  
  const normalizedInput = userInput.toLowerCase().trim();
  
  // MUCH MORE RESTRICTIVE - Only severe distress patterns
  const hinderingPatterns = [
    // Severe self-harm ideation (not suicide)
    'want to hurt myself', 'thinking about hurting myself', 'considering hurting myself',
    'feel like hurting myself', 'need to hurt myself', 'urge to hurt myself',
    
    // Severe self-hatred
    'hate myself so much', 'despise myself', 'loathe myself', 'disgusted with myself',
    'worthless piece of shit', 'complete waste of space', 'should never have been born',
    
    // Severe hopelessness with despair
    'no hope left at all', 'completely hopeless', 'hopeless situation', 'never going to get better',
    'trapped with no way out', 'stuck in hell forever', 'doomed to suffer',
    
    // Severe emotional crisis
    'completely broken', 'falling apart', 'cant function anymore', 'losing my mind',
    'going crazy', 'mental breakdown', 'emotional breakdown', 'cant cope anymore',
    
    // Severe isolation with despair
    'nobody would care if i died', 'nobody would miss me', 'better off dead',
    'world would be better without me', 'burden to everyone', 'everyone hates me'
  ];
  
  // Require at least TWO hindering patterns for maximum specificity
  const matchCount = hinderingPatterns.filter(pattern => 
    containsExactPhrase(normalizedInput, pattern)
  ).length;
  
  return matchCount >= 2;
};

// MAIN CRISIS DETECTION FUNCTION
export const detectCrisisLevel = (userInput: string, backendHinderingFlag?: boolean): CrisisLevel => {
  // Honor backend hindering flag if set
  if (backendHinderingFlag === true) {
    return 'hindering';
  }
  
  // Input validation
  if (!userInput || userInput.trim().length === 0) {
    return 'normal';
  }
  
  // NUCLEAR FIX: Explicit positive content check FIRST
  const input = userInput.toLowerCase().trim().replace(/[.,!?;:\-()[\]{}'"]/g, ' ').replace(/\s+/g, ' ');
  
  // Hard-coded positive exit conditions that CANNOT be overridden
  if (input.includes('proud of') || 
      input.includes('accomplished') || 
      input.includes('did well') ||
      input.includes('feel good') ||
      input.includes('feel great') ||
      input.includes('what i did today') ||
      input.includes('happy about') ||
      input.includes('excited about')) {
    return 'normal';
  }
  
  // POSITIVE CONTENT COMPREHENSIVE CHECK
  if (isPositiveContent(userInput)) {
    return 'normal';
  }
  
  // Only proceed with crisis detection if content is NOT positive
  
  // 1. Check for immediate crisis (Tier 3)
  if (detectImmediateCrisis(userInput)) {
    return 'crisis';
  }
  
  // 2. Check for elevated concern (Tier 2)  
  if (detectElevatedConcern(userInput)) {
    return 'elevated';
  }
  
  // 3. Check for hindering content (Tier 1)
  if (detectHinderingEntry(userInput)) {
    return 'hindering';
  }
  
  // 4. Default to normal
  return 'normal';
}; 