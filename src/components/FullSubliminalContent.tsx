import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  useFonts,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';
import { CrisisLevel, getCrisisResourcesByRegion } from '../utils/crisisResources';
import CrisisModal from './CrisisModal';

type FullSubliminalContentProps = {
  userInput: string;
  selectedArchetype: string;
  archetypeData: {
    icon: string;
    response: string;
    fullMessage: string;
    quote: string;
    tags: string[];
    isHinderingEntry?: boolean;
  };
  crisisInterventionShown?: boolean;
};

const CRISIS_RESOURCES = [
  {
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    description: "24/7, free and confidential support"
  },
  {
    name: "Crisis Text Line",
    number: "741741",
    description: "Text HOME for 24/7 crisis support"
  },
  {
    name: "SAMHSA National Helpline",
    number: "1-800-662-4357",
    description: "Mental health and substance abuse"
  },
  {
    name: "Mental Health America",
    url: "https://www.mhanational.org/finding-help",
    description: "Find local mental health resources"
  },
  {
    name: "Psychology Today",
    url: "https://www.psychologytoday.com/us/therapists",
    description: "Find therapists and mental health professionals"
  }
];

export const FullSubliminalContent: React.FC<FullSubliminalContentProps> = ({
  userInput,
  selectedArchetype,
  archetypeData,
  crisisInterventionShown = false,
}) => {
  // ═══ ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL LOGIC BEFORE HOOKS ═══
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_500Medium_Italic,
  });
  const [showUserInputModal, setShowUserInputModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  // Crisis detection logic (moved up to ensure hooks are called consistently)
  const cleanMainMessage = (fullMessage: string): string => {
    const supportMessagePattern = /\s*💬 If things feel overwhelming, talking to someone can really help\. You're not alone\./;
    return fullMessage.replace(supportMessagePattern, '').trim();
  };

  const cleanedMessage = cleanMainMessage(archetypeData.fullMessage || archetypeData.response);
  
  const detectHinderingEntry = (): boolean => {
    const fullContent = archetypeData.fullMessage || archetypeData.response || '';
    
    if (archetypeData.isHinderingEntry === true) {
      return true;
    }
    
    if (fullContent.includes('💬 If things feel overwhelming')) {
      return true;
    }
    
    const normalizedInput = userInput
      .toLowerCase()
      .replace(/[.,!?;:\-()[\]{}'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
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
      'feel progress', 'feeling progress', 'making progress', 'growing stronger',
      'getting better', 'improving', 'healing', 'recovered', 'recovering',
      'feel centered', 'feeling centered', 'feel balanced', 'feeling balanced',
      'feel at peace', 'feeling at peace', 'feel whole', 'feeling whole',
      'had a good day', 'having a good day', 'great day', 'wonderful day',
      'things are good', 'things are great', 'life is good', 'life is great',
      'things are looking up', 'turning around', 'getting back on track',
      'feeling myself again', 'back to myself', 'like myself again',
      'proud of', 'proud that', 'proud of myself', 'accomplished something', 'achieved', 'succeeded',
      'how far ive come', 'how far i have come', 'where i am now', 'come so far',
      'progress ive made', 'progress i have made', 'growth ive had', 'journey ive taken',
      'won', 'victory', 'breakthrough', 'milestone', 'celebration',
      'grateful for', 'thankful for', 'blessed with', 'appreciate',
      'love my', 'surrounded by love', 'supported by', 'great friends',
      'wonderful family', 'amazing people', 'feel loved by', 'care about me',
      'excited about', 'looking forward', 'cant wait', 'eager to',
      'optimistic about', 'hopeful about', 'confident about', 'ready for',
      'bright future', 'good things coming', 'positive changes',
      'overcame', 'got through', 'survived', 'made progress', 'moved forward',
      'reached my goal', 'completed', 'finished', 'made it', 'did it',
      'celebrating', 'victory', 'triumph', 'achievement', 'accomplishment'
    ];
    
    const hasPositiveContent = positivePatterns.some(pattern => 
      normalizedInput.includes(pattern)
    );
    
    if (hasPositiveContent) {
      return false;
    }
    
    const hinderingPatterns = [
      // DIRECT SUICIDAL IDEATION
      'kill myself', 'end my life', 'take my own life', 'commit suicide', 
      'want to die', 'wish i was dead', 'better off dead', 'end it all',
      'suicide', 'suicidal', 'want to disappear forever', 'cease to exist',
      'should just disappear', 'should disappear', 'should just die',
      'should kill myself', 'would be better if i died', 'ready to die',
      'want to be dead', 'wish i could die', 'hope i die', 'need to die',
      'going to kill myself', 'planning to die', 'done with life',
      'thinking about suicide', 'considering suicide', 'want out of this life',
      'dont want to live anymore', 'don\'t want to live anymore', 'dont want to live',
      
      // END IT ALL VARIATIONS
      'feel like ending it all', 'ending it all', 'want to end everything',
      'end it all', 'end everything', 'end this all', 'just end it all',
      'want to end it all', 'i want to end it all', 'want to just end it all',
      'i want to just end it all', 'just want to end it all', 'wanna end it all',
      'gonna end it all', 'going to end it all', 'ready to end it all',
      'need to end it all', 'time to end it all', 'should end it all',
      'have to end it all', 'might end it all', 'could end it all',
      'feel like ending it all', 'thinking about ending it all',
      'considering ending it all', 'planning to end it all',
      
      // DISAPPEAR VARIATIONS
      'want to disappear', 'wish i could disappear', 'want to just disappear',
      'wish i could just disappear', 'should just disappear', 'need to disappear',
      'going to disappear', 'gonna disappear', 'wanna disappear',
      'feel like disappearing', 'thinking about disappearing',
      'want to disappear forever', 'wish i could disappear forever',
      'should disappear forever', 'vanish forever', 'fade away',
      'invisible forever', 'gone forever', 'erased from existence',
      
      // DON'T WANT TO LIVE VARIATIONS
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
      'check out', 'tap out', 'throw in the towel', 'give up the ghost',
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
      'permanent solution', 'forever sleep', 'eternal peace',
      'never wake up', 'close my eyes and never open them',
      'stop breathing', 'heart stop beating', 'cease existing',
      
      // PREPARATION LANGUAGE
      'writing notes', 'goodbye letters', 'final messages',
      'last words', 'funeral plans', 'will and testament',
      'giving away belongings', 'saying goodbyes', 'tying up loose ends',
      'clearing browser history', 'deleting accounts', 'final preparations',
      
      // TIMING INDICATORS
      'tonight', 'tomorrow', 'this weekend', 'soon',
      'after this', 'when i get home', 'once everyone leaves',
      'perfect time', 'right moment', 'when the time comes',
      
      // RESEARCH/PLANNING LANGUAGE
      'how to', 'best way to', 'easiest method', 'painless way',
      'quick death', 'instant', 'guaranteed method', 'foolproof',
      'researching methods', 'looking up ways', 'suicide methods',
      
      // MASKED/SUBTLE LANGUAGE
      'taking a permanent break', 'long sleep', 'going away forever',
      'wont be around much longer', 'last time you see me',
      'remember me fondly', 'take care of my things',
      'watch over my pet', 'look after mom',
      
      // DESPERATION LANGUAGE
      'cant take it anymore', 'breaking point', 'last straw',
      'edge of the cliff', 'about to snap', 'losing it',
      'spiraling down', 'rock bottom', 'pit of despair',
      'darkness consuming me', 'void', 'abyss',
      
      // ISOLATION LANGUAGE
      'all alone', 'nobody understands', 'completely isolated',
      'no one to turn to', 'no way out', 'trapped',
      'corner', 'backed into corner', 'nowhere to run',
      
      // HOPELESSNESS
      'no hope', 'hopeless', 'pointless', 'meaningless',
      'whats the point', 'why bother', 'nothing matters',
      'never get better', 'always be like this', 'permanent damage',
      
      // PAIN DESCRIPTORS
      'unbearable pain', 'torture', 'agony', 'suffering',
      'cant take the pain', 'pain never stops', 'constant pain',
      'emotional pain', 'heart breaking', 'soul crushing',
      
      // COMPARISON LANGUAGE
      'everyone else is better off', 'dont deserve to live',
      'taking up space', 'oxygen thief', 'waste of life',
      'should have been someone else', 'wrong person survived',
      
      // EUPHEMISMS
      'go to a better place', 'find peace', 'end the suffering',
      'stop the pain', 'make it stop', 'turn off the noise',
      'silence the voices', 'quiet the storm', 'still the chaos'
    ];

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

  // SYSTEMATIC MULTI-LAYER CRISIS DETECTION
  const detectCrisisLevel = (): CrisisLevel => {
    const fullContent = archetypeData.fullMessage || archetypeData.response || '';
    
    if (archetypeData.isHinderingEntry === true) {
      return 'hindering';
    }
    
    if (fullContent.includes('💬 If things feel overwhelming')) {
      return 'hindering';
    }
    
    const normalizedInput = userInput
      .toLowerCase()
      .replace(/[.,!?;:\-()[\]{}'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE CRISIS DETECTION SYSTEM - SYSTEMATIC APPROACH
    // ═══════════════════════════════════════════════════════════════════════════════
    
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
    if (detectHinderingEntry()) return 'hindering';
    if (euphemismResult.level === 'hindering') return 'hindering';
    
    return 'normal';
  };

  const crisisLevel = detectCrisisLevel();
  const isHinderingEntry = crisisLevel === 'hindering' || detectHinderingEntry();
  
  // TIER 3: Active Crisis - Show full-screen modal immediately (useEffect MUST be called consistently)
  // Skip if crisis intervention was already shown on archetype selection screen
  useEffect(() => {
    if (crisisLevel === 'crisis' && !crisisInterventionShown) {
      setShowCrisisModal(true);
    }
  }, [crisisLevel, crisisInterventionShown]);

  // Helper functions
  const truncateUserInput = (input: string, maxLines: number = 3): { truncated: string; needsTruncation: boolean } => {
    const words = input.split(' ');
    const wordsPerLine = 6;
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) {
      return { truncated: input, needsTruncation: false };
    }
    
    const truncated = words.slice(0, maxWords).join(' ') + '...';
    return { truncated, needsTruncation: true };
  };

  const handleSupportResourcePress = async (resource: typeof CRISIS_RESOURCES[0]) => {
    if (resource.number) {
      const phoneUrl = `tel:${resource.number}`;
      try {
        await Linking.openURL(phoneUrl);
      } catch (error) {
        Alert.alert('Unable to make call', 'Please dial ' + resource.number + ' manually.');
      }
    } else if (resource.url) {
      try {
        await Linking.openURL(resource.url);
      } catch (error) {
        Alert.alert('Unable to open link', 'Please visit ' + resource.url + ' in your browser.');
      }
    }
  };

  const { truncated: displayUserInput, needsTruncation } = truncateUserInput(userInput);

  // DEBUG: Log crisis detection results
  console.log('🚨 CRISIS DETECTION DEBUG:', {
    userInput: userInput.substring(0, 50) + (userInput.length > 50 ? '...' : ''),
    crisisLevel,
    isHinderingEntry,
    backendFlag: archetypeData.isHinderingEntry,
    crisisInterventionShown,
    willSkipCrisisModal: crisisLevel === 'crisis' && crisisInterventionShown
  });

  // Early return AFTER all hooks have been called
  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.content}>
      {/* Original User Prompt */}
      <View style={styles.promptContainer}>
        <Text style={styles.promptLabel}>YOUR PROMPT</Text>
        <TouchableOpacity 
          onPress={() => needsTruncation && setShowUserInputModal(true)}
          disabled={!needsTruncation}
          activeOpacity={needsTruncation ? 0.7 : 1}
        >
          <Text style={[styles.promptText, needsTruncation && styles.tappablePrompt]}>
            "{displayUserInput}"
          </Text>
          {needsTruncation && (
            <Text style={styles.tapHint}>Tap to see full message</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Archetype Header */}
      <View style={styles.archetypeHeader}>
        <Text style={styles.archetypeIcon}>{archetypeData.icon}</Text>
        <View style={styles.archetypeTitleContainer}>
          <Text style={styles.archetypeTitle}>{selectedArchetype}</Text>
          <Text style={styles.archetypeSubtitle}>{archetypeData.tags.join(' • ')}</Text>
        </View>
      </View>

      {/* Main Message */}
      <View style={styles.messageContainer}>
        {/* TIER 2: Shortened message for elevated concern */}
        {crisisLevel === 'elevated' ? (
          <Text style={styles.messageText}>
            {cleanedMessage.split('.').slice(0, 2).join('.') + (cleanedMessage.split('.').length > 2 ? '.' : '')}
          </Text>
        ) : (
          <Text style={styles.messageText}>{cleanedMessage}</Text>
        )}
        
        {/* TIER 2: Enhanced Crisis Resources for Elevated Concern */}
        {crisisLevel === 'elevated' && (
          <View style={styles.supportContainer}>
            <View style={styles.supportDivider} />
            <Text style={styles.supportEmoji}>🚨</Text>
            <View style={styles.supportHeader}>
              <Text style={styles.supportTitle}>We're here if you need extra support</Text>
            </View>
            <Text style={styles.supportMessage}>
              It sounds like you're going through something really tough right now. That takes courage to share, and you don't have to face this alone.
            </Text>
            <TouchableOpacity 
              style={[styles.supportButton, styles.elevatedSupportButton]}
              onPress={() => setShowSupportModal(true)}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={[styles.supportButtonText, styles.elevatedSupportButtonText]}>Talk to someone now</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* TIER 1: Support Resources for Hindering Entries */}
        {isHinderingEntry && crisisLevel !== 'elevated' && (
          <View style={styles.supportContainer}>
            <View style={styles.supportDivider} />
            <Text style={styles.supportEmoji}>❤️‍🩹</Text>
            <View style={styles.supportHeader}>
              <Text style={styles.supportTitle}>You Don't Have to Face This Alone</Text>
            </View>
            <Text style={styles.supportMessage}>
              Professional support can make a real difference. Here are some resources available 24/7:
            </Text>
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={() => setShowSupportModal(true)}
            >
              <Ionicons name="call" size={16} color="#7B9BFF" />
              <Text style={styles.supportButtonText}>Crisis Support & Resources</Text>
              <Ionicons name="chevron-forward" size={16} color="#7B9BFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

            {/* Quote */}
      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>{archetypeData.quote}</Text>
      </View>

      {/* Support Resources Modal */}
      <Modal
        visible={showSupportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.supportModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crisis Support & Resources</Text>
              <TouchableOpacity 
                onPress={() => setShowSupportModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalSubtitle}>
                If you're in immediate danger, please call 911 or go to your nearest emergency room.
              </Text>
              
              {CRISIS_RESOURCES.map((resource, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.resourceItem}
                  onPress={() => handleSupportResourcePress(resource)}
                >
                  <View style={styles.resourceContent}>
                    <View style={styles.resourceHeader}>
                      <Ionicons 
                        name={resource.number ? "call" : "open"} 
                        size={20} 
                        color="#7B9BFF" 
                      />
                      <Text style={styles.resourceName}>{resource.name}</Text>
                    </View>
                    <Text style={styles.resourceDescription}>{resource.description}</Text>
                    {resource.number && (
                      <Text style={styles.resourceNumber}>{resource.number}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
              
              <Text style={styles.modalFooter}>
                Remember: Seeking help is a sign of strength, not weakness. You deserve support and care.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* User Input Modal */}
      <Modal
        visible={showUserInputModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Input</Text>
              <TouchableOpacity 
                onPress={() => setShowUserInputModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalText}>"{userInput}"</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* TIER 3: Crisis Intervention Modal */}
      <CrisisModal
        visible={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
        userRegion="US"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  promptContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  promptLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  promptText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  divider: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginVertical: 32,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  archetypeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  archetypeTitleContainer: {
    flex: 1,
  },
  archetypeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  archetypeSubtitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageContainer: {
    marginBottom: 32,
  },
  messageText: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 24,
  },
  quoteContainer: {
    marginBottom: 32,
  },
  quoteText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'PlayfairDisplay_500Medium_Italic',
    textAlign: 'center',
  },
  tappablePrompt: {
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  modalScrollView: {
    padding: 20,
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  tapHint: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'left',
  },
  supportContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  supportDivider: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginVertical: 16,
  },
  supportHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  supportEmoji: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  supportMessage: {
    color: '#666',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7B9BFF',
  },
  supportButtonText: {
    color: '#7B9BFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  elevatedSupportButton: {
    backgroundColor: '#EF5350',
    borderColor: '#EF5350',
  },
  elevatedSupportButtonText: {
    color: '#fff',
  },
  supportModalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  modalSubtitle: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  resourceContent: {
    flex: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  resourceDescription: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  resourceNumber: {
    color: '#7B9BFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
}); 