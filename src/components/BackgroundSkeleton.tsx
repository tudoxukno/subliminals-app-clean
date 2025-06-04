import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from './ShimmerSkeleton';

type BackgroundSkeletonProps = {
  count?: number;
};

export const BackgroundSkeleton: React.FC<BackgroundSkeletonProps> = ({
  count = 8,
}) => {
  return (
    <View style={styles.container}>
      <ShimmerSkeleton
        width={80}
        height={16}
        borderRadius={4}
        style={styles.titleSkeleton}
      />
      <View style={styles.backgroundPickerContainer}>
        <View style={styles.backgroundPicker}>
          <View style={styles.backgroundPickerContent}>
            {Array.from({ length: count }).map((_, index) => (
              <ShimmerSkeleton
                key={index}
                width={64}
                height={72}
                borderRadius={8}
                style={styles.backgroundSkeleton}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleSkeleton: {
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
    flexDirection: 'row',
    paddingRight: 20,
    gap: 16,
    paddingVertical: 4,
  },
  backgroundSkeleton: {
    // Additional styling if needed
  },
}); 