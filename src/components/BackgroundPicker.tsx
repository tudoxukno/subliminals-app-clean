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
  styleIndex?: number; // Current style index for AI backgrounds
  styleName?: string; // Name of the current style
  isLoading?: boolean; // Flag to indicate if the AI background is being generated
};

type BackgroundPickerProps = {
  backgrounds: Background[];
  selectedBackground: Background | null;
  onSelectBackground: (background: Background) => void;
  onRegenerateBackground?: (background: Background) => void;
  title?: string;
  isRegenerating?: boolean;
};

const BackgroundThumbnail: React.FC<{
  background: Background;
  isSelected: boolean;
  onPress: () => void;
  onRegenerate?: () => void;
  shouldStartLoading: boolean;
  onLoadComplete: () => void;
  isRegenerating?: boolean;
}> = ({ background, isSelected, onPress, onRegenerate, shouldStartLoading, onLoadComplete, isRegenerating }) => {
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

  // Handle AI-generated background that's still loading
  if (background.isAIGenerated && background.isLoading) {
    return (
      <TouchableOpacity
        onPress={onPress}
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
      onPress={onPress}
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
                {background.label === 'AI Generated' ? 'AI' : background.label}
              </Text>
            </View>
          )}
          {background.isAIGenerated && onRegenerate && (
            <TouchableOpacity 
              style={styles.regenerateButton}
              onPress={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <ActivityIndicator size="small" color="#fff" />
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
}) => {
  const [loadedCount, setLoadedCount] = useState(0);

  // Reset loaded count when backgrounds change
  useEffect(() => {
    setLoadedCount(0);
  }, [backgrounds]);

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
            // Calculate the actual image index (excluding "None" options)
            const imageBackgrounds = backgrounds.filter(b => b.source !== null || b.url);
            const imageIndex = imageBackgrounds.findIndex(b => b.id === bg.id);
            
            // For "None" option (no source or url), always allow loading immediately
            // For images, only start loading when it's their turn in the sequence
            const shouldStartLoading = (!bg.source && !bg.url) || imageIndex <= loadedCount;
            
            return (
              <BackgroundThumbnail
                key={bg.id}
                background={bg}
                isSelected={selectedBackground?.id === bg.id}
                onPress={() => handleBackgroundSelect(bg)}
                onRegenerate={onRegenerateBackground ? () => onRegenerateBackground(bg) : undefined}
                shouldStartLoading={shouldStartLoading}
                onLoadComplete={(bg.source || bg.url) ? handleImageLoadComplete : () => {}}
                isRegenerating={isRegenerating}
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
}); 