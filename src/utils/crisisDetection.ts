import { CrisisLevel } from './crisisResources';

// Helper function for string distance calculation
const getLevenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Detect hindering entries (tier 1)
const detectHinderingEntry = (userInput: string): boolean => {
  const normalizedInput = userInput
    .toLowerCase()
    .replace(/[.,!?;:\-()[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Positive patterns that should NOT be flagged as hindering
  const positivePatterns = [
    'feel great', 'feeling great', 'feel amazing', 'feeling amazing', 
    'feel wonderful', 'feeling wonderful', 'feel fantastic', 'feeling fantastic',
    'feel good', 'feeling good', 'feel better', 'feeling better',
    'feel happy', 'feeling happy', 'feel joyful', 'feeling joyful',
    'feel blessed', 'feeling blessed', 'feel grateful', 'feeling grateful',
    'feel thankful', 'feeling thankful', 'feel positive', 'feeling positive',
    'feel optimistic', 'feeling optimistic', 'feel hopeful', 'feeling hopeful',
    'feel confident', 'feeling confident', 'feel strong', 'feeling strong',
    'feel proud', 'feeling proud', 'feel accomplished', 'feeling accomplished',
    'feel successful', 'feeling successful', 'feel fulfilled', 'feeling fulfilled',
    'feel content', 'feeling content', 'feel peaceful', 'feeling peaceful',
    'feel calm', 'feeling calm', 'feel relaxed', 'feeling relaxed',
    'feel energized', 'feeling energized', 'feel motivated', 'feeling motivated',
    'feel inspired', 'feeling inspired', 'feel excited', 'feeling excited',
    'feel ready', 'feeling ready', 'feel prepared', 'feeling prepared',
    'feel supported', 'feeling supported', 'feel loved', 'feeling loved',
    'feel appreciated', 'feeling appreciated', 'feel valued', 'feeling valued',
    'feel connected', 'feeling connected', 'feel like im growing', 'feeling like im growing',
    'feel progress', 'feeling progress', 'making progress', 'growing stronger'
  ];

  // Check for positive patterns first
  const hasPositivePattern = positivePatterns.some(pattern => normalizedInput.includes(pattern));
  if (hasPositivePattern) {
    return false;
  }

  const hinderingPatterns = [
    // SUICIDE IDEATION PATTERNS
    'kill myself', 'end my life', 'take my life', 'commit suicide',
    'suicide', 'suicidal', 'kill me', 'end me', 'end it all',
    'want to die', 'wanna die', 'wish i was dead', 'wish i were dead',
    'better off dead', 'should be dead', 'deserve to die',
    'ready to die', 'time to die', 'going to die', 'gonna die',
    'planning to die', 'thinking about dying', 'want to disappear',
    'disappear forever', 'cease to exist', 'stop existing',
    'dont want to live', 'don\'t want to live', 'do not want to live',
    'dont want to live anymore', 'don\'t want to live anymore',
    'do not want to live anymore', 'dont wanna live', 'don\'t wanna live',
    'tired of living', 'sick of living', 'done with living',
    'cant live like this', 'can\'t live like this', 'cannot live like this',
    'dont want to be alive', 'don\'t want to be alive',
    'wish i wasnt alive', 'wish i wasn\'t alive', 'wish i was never alive',
    
    // SELF-HARM PATTERNS
    'hurt myself', 'harm myself', 'cut myself', 'cutting myself',
    'self harm', 'self-harm', 'want to cut', 'going to cut',
    'thinking about cutting', 'need to cut', 'deserve to be hurt',
    'should hurt myself', 'want to hurt myself', 'make myself bleed',
    'punish myself', 'deserve pain', 'need to feel pain',
    
    // WORTHLESSNESS PATTERNS
    'everyone would be better off without me', 'better off without me',
    'world would be better without me', 'wish i was never born',
    'wish i never existed', 'shouldnt exist', 'regret being born',
    'shouldve never been born', 'should have never been born',
    'never should have been born', 'mistake to be born',
    'shouldnt be here', 'don\'t belong here', 'dont belong here',
    'nobody would miss me', 'no one would miss me', 'wouldnt be missed',
    'nobody would care', 'no one would care', 'nobody cares',
    
    // SELF-HATRED
    'hate myself', 'hate my life', 'disgusted with myself',
    'worthless', 'useless', 'pathetic', 'failure',
    'cant do anything right', 'mess everything up', 'ruin everything',
    'lost cause', 'hopeless case', 'beyond help',
    
    // OVERWHELM PATTERNS
    'mental breakdown', 'losing my mind', 'going crazy',
    'cant cope', 'cant handle', 'overwhelmed completely',
    'drowning', 'suffocating', 'trapped forever',
    
    // METAPHORICAL/CODED LANGUAGE
    'check out', 'tap out', 'throw in the towel',
    'cash in my chips', 'call it quits', 'bow out', 'exit stage left',
    'peace out forever', 'signing off', 'logging out permanently',
    'going to the light', 'crossing over', 'final exit',
    'last chapter', 'the end', 'closing the book', 'final curtain',
    'lights out', 'game over', 'power down', 'shut down',
    'pull the plug', 'flip the switch', 'turn off the lights',
    'close my eyes forever', 'go to sleep forever', 'eternal rest',
    'permanent vacation', 'final journey', 'one way trip',
    'no return ticket', 'burning bridges', 'point of no return',
    
    // SLANG/INTERNET LANGUAGE
    'kms', 'kill me now', 'delete myself', 'uninstall life',
    'ctrl alt delete myself', 'factory reset', 'hard reset',
    'format my hard drive', 'blue screen of death', 'system shutdown',
    'rage quit life', 'respawn irl', 'log off permanently',
    'account deletion', 'permanent ban from life', 'self destruct',
    'nuke myself', 'blow my brains out', 'eat a bullet',
    'drink bleach', 'take pills', 'overdose', 'od',
    
    // METHODS REFERENCES
    'jump off', 'hang myself', 'hanging', 'rope', 'noose',
    'bridge jumping', 'tall building', 'train tracks',
    'carbon monoxide', 'gas', 'pills', 'overdose',
    'razor blade', 'knife', 'gun', 'bullet',
    'poison', 'toxic', 'lethal dose',
    
    // EMOTIONAL/PSYCHOLOGICAL INDICATORS
    'empty inside', 'hollow', 'numb', 'broken beyond repair',
    'shattered', 'destroyed', 'ruined', 'damaged goods',
    'waste of space', 'burden', 'toxic person', 'poison',
    'virus', 'disease', 'cancer', 'parasite',
    'should have died', 'why am i still here', 'accident i survived',
    'failed suicide', 'unsuccessful attempt', 'botched it',
    
    // FINALITY LANGUAGE
    'final decision', 'last resort', 'no other choice',
    'only way out', 'escape plan', 'exit strategy',
    'permanent solution', 'forever sleep',
    
    // PAIN EXPRESSIONS
    'unbearable pain', 'excruciating pain', 'torture', 'agony',
    'constant pain', 'emotional pain', 'heart breaking', 'soul crushing',
    
    // COMPARISON LANGUAGE
    'everyone else is better off', 'dont deserve to live',
    'taking up space', 'oxygen thief', 'waste of life',
    'should have been someone else', 'wrong person survived',
    
    // EUPHEMISMS
    'go to a better place', 'find peace', 'end the suffering',
    'stop the pain', 'make it stop', 'turn off the noise',
    'silence the voices', 'quiet the storm', 'still the chaos'
  ];

  const words = normalizedInput.split(' ');

  // Enhanced pattern matching with distributed detection
  const hasHinderingContent = hinderingPatterns.some(pattern => {
    // Direct pattern matching
    if (normalizedInput.includes(pattern)) {
      return true;
    }
    
    // Enhanced distributed word detection for critical patterns
    const criticalPatterns = [
      'kill myself', 'end my life', 'suicide', 'want to die', 'end it all',
      'disappear forever', 'dont want to live', 'hurt myself', 'hate myself'
    ];
    
    if (criticalPatterns.includes(pattern)) {
      const patternWords = pattern.split(' ');
      const inputWords = normalizedInput.split(' ');
      let matchCount = 0;
      let foundPositions: number[] = [];
      
      patternWords.forEach((word, index) => {
        const wordVariations = [
          word,
          word.replace('cant', 'cannot'),
          word.replace('im', 'i am'),
          word.replace('dont', 'do not'),
          word.replace('wont', 'will not'),
          word.replace('shouldnt', 'should not'),
          word.replace('couldnt', 'could not'),
          word.replace('wouldnt', 'would not')
        ];
        
        for (let i = 0; i < inputWords.length; i++) {
          if (wordVariations.includes(inputWords[i]) || 
              getLevenshteinDistance(inputWords[i], word) <= 1) {
            matchCount++;
            foundPositions.push(i);
            break;
          }
        }
      });
      
      // Allow for distributed words but require most key words to be present
      if (matchCount >= Math.max(2, Math.ceil(patternWords.length * 0.8))) {
        // Check if words are reasonably close (within 20 words of each other)
        if (foundPositions.length >= 2) {
          const maxDistance = Math.max(...foundPositions) - Math.min(...foundPositions);
          if (maxDistance <= 20) {
            return true;
          }
        }
      }
    }
    
    // Typo tolerance for shorter phrases
    const words = pattern.split(' ');
    if (words.length <= 3) {
      for (const word of normalizedInput.split(' ')) {
        if (getLevenshteinDistance(word, pattern.replace(/\s/g, '')) <= 2 && word.length >= 4) {
          return true;
        }
      }
    }
    
    return false;
  });

  // Additional checks for abbreviations and coded language
  const codeWords = ['kms', 'ctb', 'sui', 'sewer slide', 'toaster bath'];
  const hasCodeWords = codeWords.some(code => normalizedInput.includes(code));
  
  // Check for concerning combinations even if individual words aren't triggers
  const concerningCombinations = [
    ['pain', 'stop', 'forever'], ['tired', 'fighting', 'give up'],
    ['break', 'cant', 'anymore'], ['end', 'suffering', 'now'],
    ['peace', 'finally', 'rest'], ['escape', 'only', 'way'],
    ['solution', 'permanent', 'problem'], ['better', 'without', 'me'],
    ['goodbye', 'world', 'cruel'], ['note', 'final', 'goodbye']
  ];
  
  const hasConcerningCombination = concerningCombinations.some(combo => {
    return combo.every(word => normalizedInput.includes(word));
  });

  return hasHinderingContent || hasCodeWords || hasConcerningCombination;
};

// Main crisis detection function
export const detectCrisisLevel = (userInput: string, backendHinderingFlag?: boolean): CrisisLevel => {
  if (backendHinderingFlag === true) {
    return 'hindering';
  }
  
  const normalizedInput = userInput
    .toLowerCase()
    .replace(/[.,!?;:\-()[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // TIER 3 (CRISIS): IMMEDIATE TIMELINE + INTENT DETECTION
  const detectImmediateCrisis = (): boolean => {
    const words = normalizedInput.split(' ');
    
    // Core intent indicators (what they want to do)
    const intentIndicators = [
      'kill myself', 'kill my self', 'end my life', 'take my life', 'commit suicide',
      'end it all', 'end everything', 'do it', 'finish it', 'go through with it'
    ];
    
    // Timeline indicators (when they plan to do it)
    const timelineIndicators = [
      'tonight', 'today', 'now', 'soon', 'tomorrow', 'this weekend', 'after work',
      'when i get home', 'in a few hours', 'before morning', 'this evening'
    ];
    
    // Future action phrases (how they express future intent)
    const futureActionPhrases = [
      'going to', 'gonna', 'about to', 'ready to', 'planning to', 'going to just',
      'gonna just', 'about to just', 'ready to just', 'planning to just'
    ];
    
    // Method 1: Check for timeline + intent in same sentence (flexible matching)
    for (const timeline of timelineIndicators) {
      if (normalizedInput.includes(timeline)) {
        for (const intent of intentIndicators) {
          // Check if intent appears anywhere in the text (allows for extra words)
          if (normalizedInput.includes(intent)) {
            return true;
          }
          // Also check for distributed words like "kill" and "myself" separately
          if (intent.includes(' ')) {
            const intentWords = intent.split(' ');
            const allWordsPresent = intentWords.every(word => 
              words.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
            );
            if (allWordsPresent) {
              return true;
            }
          }
        }
      }
    }
    
    // Method 2: Check for future action + intent + timeline combinations
    for (const futureAction of futureActionPhrases) {
      if (normalizedInput.includes(futureAction)) {
        for (const timeline of timelineIndicators) {
          if (normalizedInput.includes(timeline)) {
            // If we have "going to" and a timeline, look for any self-harm intent
            const selfHarmWords = ['kill', 'end', 'die', 'suicide', 'harm', 'hurt'];
            const selfWords = ['myself', 'my self', 'me'];
            
            const hasSelfHarm = selfHarmWords.some(word => words.includes(word));
            const refersSelf = selfWords.some(phrase => 
              normalizedInput.includes(phrase) || 
              words.some(word => phrase.split(' ').every(part => word.includes(part)))
            );
            
            if (hasSelfHarm && refersSelf) {
              return true;
            }
          }
        }
      }
    }
    
    // Method 3: Specific high-risk phrases (exact matching)
    const immediateCrisisPatterns = [
      'going to kill myself tonight', 'gonna kill myself tonight', 'killing myself tonight',
      'going to kill myself today', 'gonna kill myself today', 'killing myself today',
      'going to end it tonight', 'gonna end it tonight', 'ending it tonight',
      'going to end it today', 'gonna end it today', 'ending it today',
      'going to do it tonight', 'gonna do it tonight', 'doing it tonight',
      'going to do it today', 'gonna do it today', 'doing it today',
      'about to kill myself', 'ready to kill myself', 'planning to kill myself',
      'going to just kill myself', 'gonna just kill myself', 'going to just end it',
      'ready to die', 'ready to go', 'time to go', 'this is it', 'goodbye world',
      'have a plan', 'plan to kill myself', 'method chosen', 'everything ready',
      'pills ready', 'rope ready', 'gun ready', 'bridge picked', 'building chosen',
      'writing my note', 'suicide note ready', 'said my goodbyes', 'final goodbyes',
      'giving away my things', 'clearing out room', 'final preparations',
      'cant wait anymore', 'doing it right now', 'happening now',
      'final decision made', 'mind made up', 'no going back', 'point of no return'
    ];
    
    return immediateCrisisPatterns.some(pattern => normalizedInput.includes(pattern));
  };
  
  // TIER 2 (ELEVATED): INTENT WITHOUT IMMEDIATE TIMELINE
  const detectElevatedConcern = (): boolean => {
    // Intent patterns showing future planning without specific timeline
    const elevatedIntentPatterns = [
      'gonna kill myself', 'going to kill myself', 'want to kill myself',
      'planning to kill myself', 'thinking about killing myself', 'considering killing myself',
      'might kill myself', 'probably kill myself', 'should kill myself', 'could kill myself',
      'tempted to kill myself', 'feel like killing myself', 'would kill myself',
      'gonna end it all', 'going to end it all', 'want to end it all', 'feel like ending it all',
      'thinking about ending it all', 'considering ending it all', 'might end it all',
      'gonna end it', 'going to end it', 'want to end it', 'might end it',
      'considering suicide', 'thinking about suicide', 'might commit suicide',
      'researching suicide', 'looking up methods', 'wondering how to', 'curious about methods',
      'want to disappear forever', 'wish i could disappear forever', 'need to disappear'
    ];
    
    // Strong distress patterns indicating elevated risk
    const elevatedDistressPatterns = [
      'cant take this anymore', 'cant go on', 'cant handle this', 'cant take much more',
      'breaking point', 'about to break', 'overwhelmed beyond repair', 'drowning in pain',
      'want to give up', 'ready to give up', 'giving up on everything', 'tired of fighting',
      'done fighting', 'cant fight anymore', 'no fight left', 'throwing in the towel',
      'no point anymore', 'whats the point', 'why bother', 'meaningless existence',
      'tired of living', 'exhausted from living', 'sick of existing', 'done with life',
      'want out', 'need to escape', 'desperate to escape', 'trapped forever'
    ];
    
    return elevatedIntentPatterns.some(pattern => normalizedInput.includes(pattern)) ||
           elevatedDistressPatterns.some(pattern => normalizedInput.includes(pattern));
  };
  
  // DISTRIBUTED WORD ANALYSIS - Enhanced scoring system
  const analyzeDistributedWords = (): 'crisis' | 'elevated' | 'hindering' | null => {
    const words = normalizedInput.split(' ');
    
    // Crisis-level distributed patterns (immediate threat)
    const crisisKeywords = {
      intent: ['kill', 'suicide', 'die', 'death', 'end', 'finish', 'harm'],
      self: ['myself', 'me', 'self'],
      timeline: ['tonight', 'today', 'now', 'soon', 'tomorrow', 'this'],
      planning: ['plan', 'ready', 'prepared', 'method', 'way', 'how', 'going', 'gonna'],
      finality: ['goodbye', 'final', 'last', 'over', 'done', 'note']
    };
    
    const elevatedKeywords = {
      intent: ['kill', 'suicide', 'die', 'end', 'disappear', 'escape', 'harm'],
      self: ['myself', 'me', 'self'],
      future: ['gonna', 'going', 'want', 'thinking', 'considering', 'might', 'would'],
      distress: ['cant', 'overwhelmed', 'breaking', 'tired', 'exhausted', 'done', 'hate']
    };
    
    // Enhanced crisis scoring with more weight on timeline + intent combinations
    let crisisScore = 0;
    const hasIntent = crisisKeywords.intent.some(word => words.includes(word));
    const hasSelf = crisisKeywords.self.some(word => words.some(w => w.includes(word)));
    const hasTimeline = crisisKeywords.timeline.some(word => words.includes(word));
    const hasPlanning = crisisKeywords.planning.some(word => words.includes(word));
    const hasFinality = crisisKeywords.finality.some(word => words.includes(word));
    
    if (hasIntent) crisisScore += 3;  // Increased weight
    if (hasSelf) crisisScore += 2;    // Increased weight  
    if (hasTimeline) crisisScore += 4; // High weight for timeline
    if (hasPlanning) crisisScore += 3; // High weight for planning
    if (hasFinality) crisisScore += 2;
    
    // Special bonus for intent + timeline + self combination
    if (hasIntent && hasSelf && hasTimeline) {
      crisisScore += 3; // Bonus points for this dangerous combination
    }
    
    if (crisisScore >= 7) return 'crisis'; // Lowered threshold but higher individual weights
    
    // Elevated scoring
    let elevatedScore = 0;
    const hasElevatedIntent = elevatedKeywords.intent.some(word => words.includes(word));
    const hasElevatedSelf = elevatedKeywords.self.some(word => words.some(w => w.includes(word)));
    const hasFuture = elevatedKeywords.future.some(word => words.includes(word));
    const hasDistress = elevatedKeywords.distress.some(word => words.includes(word));
    
    if (hasElevatedIntent) elevatedScore += 2;
    if (hasElevatedSelf) elevatedScore += 1;
    if (hasFuture) elevatedScore += 2;
    if (hasDistress) elevatedScore += 1;
    
    if (elevatedScore >= 4) return 'elevated';
    
    return null;
  };
  
  // EUPHEMISM AND METAPHOR DETECTION
  const detectEuphemisms = (): { level: 'crisis' | 'elevated' | 'hindering' | null } => {
    const metaphors = {
      crisis: [
        'check out permanently', 'final exit', 'one way trip', 'no return ticket',
        'lights out forever', 'game over for good', 'permanent logout', 'final shutdown',
        'closing the book forever', 'last chapter tonight', 'curtains closing', 'show ending'
      ],
      elevated: [
        'check out', 'tap out', 'throw in the towel', 'give up the ghost',
        'cash in my chips', 'call it quits', 'bow out', 'exit stage left',
        'lights out', 'game over', 'power down', 'shut down',
        'peace out forever', 'signing off', 'logging out permanently'
      ],
      hindering: [
        'fade away', 'disappear', 'vanish', 'invisible',
        'delete myself', 'uninstall life', 'factory reset',
        'broken beyond repair', 'damaged goods', 'waste of space'
      ]
    };
    
    for (const pattern of metaphors.crisis) {
      if (normalizedInput.includes(pattern)) return { level: 'crisis' };
    }
    for (const pattern of metaphors.elevated) {
      if (normalizedInput.includes(pattern)) return { level: 'elevated' };
    }
    for (const pattern of metaphors.hindering) {
      if (normalizedInput.includes(pattern)) return { level: 'hindering' };
    }
    
    return { level: null };
  };
  
  // RUN ALL DETECTION LAYERS IN ORDER OF SEVERITY
  
  // 1. IMMEDIATE CRISIS CHECK (Tier 3)
  if (detectImmediateCrisis()) return 'crisis';
  
  // 2. DISTRIBUTED WORD ANALYSIS FOR CRISIS
  const distributedResult = analyzeDistributedWords();
  if (distributedResult === 'crisis') return 'crisis';
  
  // 3. EUPHEMISM CHECK FOR CRISIS
  const euphemismResult = detectEuphemisms();
  if (euphemismResult.level === 'crisis') return 'crisis';
  
  // 4. ELEVATED CONCERN CHECK (Tier 2)
  if (detectElevatedConcern()) return 'elevated';
  if (distributedResult === 'elevated') return 'elevated';
  if (euphemismResult.level === 'elevated') return 'elevated';
  
  // 5. HINDERING CHECK (Tier 1) - fallback to existing comprehensive detection
  if (detectHinderingEntry(userInput)) return 'hindering';
  if (euphemismResult.level === 'hindering') return 'hindering';
  
  return 'normal';
}; 