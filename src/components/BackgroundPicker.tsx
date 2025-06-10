import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ShimmerSkeleton } from './ShimmerSkeleton';

export type Background = {
  id: number;
  source: any | null; // Image source or null for "None"
  url?: string; // AI-generated background URL
  label?: string; // Optional label for the background
  isAIGenerated?: boolean; // Flag to identify AI-generated backgrounds
  backgroundType?: string; // Type of background (ai-generated, contextual-color, etc.)
  styleIndex?: number; // Current style index for AI backgrounds
  styleName?: string; // Name of the current style
  isLoading?: boolean; // Flag to indicate if the AI background is being generated
  isPremiumFeature?: boolean; // Flag to indicate if this requires premium
  canRegenerate?: boolean; // Flag to indicate if user can regenerate this background
};

type BackgroundPickerProps = {
  backgrounds: Background[];
  selectedBackground: Background | null;
  onSelectBackground: (background: Background) => void;
  onRegenerateBackground?: (background: Background) => void;
  title?: string;
  isRegenerating?: boolean;
  canRegenerateAI?: boolean; // New prop to indicate if user can regenerate AI backgrounds
  isPremiumUser?: boolean; // New prop to indicate if user is premium
  onUpgrade?: () => void; // New prop to trigger upgrade modal
};

const BackgroundThumbnail: React.FC<{
  background: Background;
  isSelected: boolean;
  onPress: () => void;
  onRegenerate?: () => void;
  shouldStartLoading: boolean;
  onLoadComplete: () => void;
  isRegenerating?: boolean;
  canRegenerateAI?: boolean; // New prop
  isPremiumUser?: boolean; // New prop
  onUpgrade?: () => void; // New prop for upgrade callback
}> = ({ background, isSelected, onPress, onRegenerate, shouldStartLoading, onLoadComplete, isRegenerating, canRegenerateAI = false, isPremiumUser = false, onUpgrade }) => {
  const [isLoading, setIsLoading] = useState(!!(background.source || background.url));
  const [hasStartedLoading, setHasStartedLoading] = useState(false);

  useEffect(() => {
    if (shouldStartLoading && !hasStartedLoading && (background.source || background.url)) {
      setHasStartedLoading(true);
    }
  }, [shouldStartLoading, hasStartedLoading, background.source, background.url]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoadComplete();
  };

  const handleImageError = () => {
    setIsLoading(false);
    onLoadComplete();
  };

  const handleRegenerate = (e: any) => {
    e.stopPropagation(); // Prevent selecting the background
    if (onRegenerate) {
      onRegenerate();
    }
  };

  const handleMainPress = () => {
    // If this is a locked AI background, trigger upgrade instead of selection
    if (background.isAIGenerated && isRegenerateLocked && onUpgrade) {
      onUpgrade();
    } else {
      onPress();
    }
  };

  // Determine if regeneration is locked - always unlocked for premium users
  const isRegenerateLocked = background.isAIGenerated && !isPremiumUser;

  // Handle AI-generated background that's still loading
  if (background.isAIGenerated && background.isLoading) {
    return (
      <TouchableOpacity
        onPress={handleMainPress}
        style={[
          styles.backgroundOption,
          isSelected && styles.backgroundOptionSelected
        ]}
        activeOpacity={0.8}
        disabled={true} // Disable interaction while loading
      >
        <View style={styles.aiLoadingContainer}>
          <ActivityIndicator size="small" color="#666" />
        </View>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>AI</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleMainPress}
      style={[
        styles.backgroundOption,
        isSelected && styles.backgroundOptionSelected
      ]}
      activeOpacity={0.8}
    >
      {background.source || background.url ? (
        <>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ShimmerSkeleton
                width="100%"
                height="100%"
                borderRadius={8}
              />
            </View>
          )}
          {hasStartedLoading && (
            <Image 
              source={background.source ? background.source : { uri: background.url }} 
              style={[
                styles.backgroundThumbnail,
                isLoading && styles.hiddenImage
              ]}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
          {background.label && (
            <View style={styles.labelContainer}>
              <Text style={styles.labelText}>
                {background.isAIGenerated && isPremiumUser ? 'AI' : 
                 background.label === 'AI Generated' ? 'AI' : background.label}
              </Text>
            </View>
          )}
          
          {/* Show background type badge - but not for AI backgrounds when user is premium or when regenerate is locked (PRO indicator is shown instead) */}
          {background.backgroundType && !(background.isAIGenerated && (isPremiumUser || isRegenerateLocked)) && (
            <View style={[
              styles.typeBadge,
              background.backgroundType === 'ai-generated' ? styles.aiBadge : styles.contextualBadge
            ]}>
              <Text style={styles.typeBadgeText}>
                {background.backgroundType === 'ai-generated' ? '✨ AI' : '🎨 Art'}
              </Text>
            </View>
          )}
          
          {/* Show premium indicator if needed - but not for premium users on AI backgrounds */}
          {background.isPremiumFeature && !(background.isAIGenerated && isPremiumUser) && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>PRO</Text>
            </View>
          )}

          {background.isAIGenerated && onRegenerate && (
            <TouchableOpacity 
              style={[
                styles.regenerateButton,
                isRegenerateLocked && styles.regenerateButtonLocked
              ]}
              onPress={handleRegenerate}
              disabled={isRegenerating}
              activeOpacity={isRegenerateLocked ? 1 : 0.8}
            >
              {isRegenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isRegenerateLocked ? (
                <View style={styles.lockedRegenerateContent}>
                  <Ionicons name="diamond" size={10} color="#fff" />
                  <Text style={styles.lockedRegenerateText}>PRO</Text>
                </View>
              ) : (
                <Ionicons name="refresh" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          )}
          
          {/* Show centered loading overlay when regenerating */}
          {background.isAIGenerated && isRegenerating && (
            <View style={styles.regenerateLoadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </>
      ) : (
        <View style={styles.noneOption}>
          <Text style={styles.noneText}>None</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
  backgrounds,
  selectedBackground,
  onSelectBackground,
  onRegenerateBackground,
  title = "Backgrounds",
  isRegenerating = false,
  canRegenerateAI = false,
  isPremiumUser = false,
  onUpgrade,
}) => {
  const [loadedCount, setLoadedCount] = useState(0);

  // Only reset loaded count when the number of AI backgrounds changes significantly
  // This prevents preset backgrounds from going black when AI background is regenerated
  useEffect(() => {
    const aiBackgroundCount = backgrounds.filter(b => b.isAIGenerated === true && b.url).length;
    if (loadedCount > aiBackgroundCount) {
      setLoadedCount(0);
    }
  }, [backgrounds, loadedCount]);

  const handleBackgroundSelect = (background: Background) => {
    // Light haptic feedback for selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectBackground(background);
  };

  const handleImageLoadComplete = () => {
    // Add a small delay before allowing the next image to start loading
    // This makes the sequential loading more visible and prevents overwhelming the system
    setTimeout(() => {
      setLoadedCount(prev => prev + 1);
    }, 100); // 100ms delay between each image load
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.backgroundPickerContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.backgroundPicker}
          contentContainerStyle={styles.backgroundPickerContent}
          decelerationRate="fast"
          snapToInterval={80} // 64 + 16 gap
          snapToAlignment="start"
        >
          {backgrounds.map((bg, index) => {
            // Calculate the actual image index (excluding "None" options and preset backgrounds)
            const aiBackgrounds = backgrounds.filter(b => b.isAIGenerated && b.url);
            const aiIndex = aiBackgrounds.findIndex(b => b.id === bg.id);
            
            // Always allow preset backgrounds (with source) and "None" option to load immediately
            // Only apply sequential loading to AI-generated backgrounds
            const shouldStartLoading = (!bg.source && !bg.url) || 
                                     bg.source !== null || 
                                     (bg.isAIGenerated === true && aiIndex <= loadedCount);
            
            return (
              <BackgroundThumbnail
                key={bg.id}
                background={bg}
                isSelected={selectedBackground?.id === bg.id}
                onPress={() => handleBackgroundSelect(bg)}
                onRegenerate={onRegenerateBackground ? () => onRegenerateBackground(bg) : undefined}
                shouldStartLoading={shouldStartLoading}
                onLoadComplete={(bg.isAIGenerated === true && bg.url) ? handleImageLoadComplete : () => {}}
                isRegenerating={isRegenerating}
                canRegenerateAI={canRegenerateAI}
                isPremiumUser={isPremiumUser}
                onUpgrade={onUpgrade}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    color: '#666',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 20,
    marginBottom: 12,
  },
  backgroundPickerContainer: {
    overflow: 'visible',
    marginBottom: 32,
  },
  backgroundPicker: {
    paddingLeft: 20,
  },
  backgroundPickerContent: {
    paddingRight: 20,
    gap: 16,
    paddingVertical: 4,
  },
  backgroundOption: {
    width: 64,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  backgroundOptionSelected: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  backgroundThumbnail: {
    width: '100%',
    height: '100%',
  },
  noneOption: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    borderRadius: 8,
  },
  noneText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  hiddenImage: {
    opacity: 0,
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  regenerateButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  regenerateButtonLocked: {
    backgroundColor: '#4A90E2', // Blue background to match archetype selection
    borderColor: '#4A90E2',
    borderWidth: 1,
    // Center horizontally
    right: 'auto',
    left: '50%',
    marginLeft: -24, // Adjusted to find the sweet spot
  },
  aiLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regenerateLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  typeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  aiBadge: {
    backgroundColor: '#FFD700',
  },
  contextualBadge: {
    backgroundColor: '#007BFF',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FF0000',
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  lockedRegenerateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedRegenerateText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
}); 