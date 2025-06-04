import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from './ShimmerSkeleton';

type SavedSubliminalsSkeletonProps = {
  count?: number;
};

export const SavedSubliminalsSkeleton: React.FC<SavedSubliminalsSkeletonProps> = ({
  count = 5,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.cardSkeleton}>
          <View style={styles.cardContent}>
            {/* Header with icon and title */}
            <View style={styles.cardHeader}>
              <ShimmerSkeleton
                width={24}
                height={24}
                borderRadius={4}
                style={styles.iconSkeleton}
              />
              <View style={styles.titleContainer}>
                <ShimmerSkeleton
                  width={120}
                  height={18}
                  borderRadius={4}
                  style={styles.titleSkeleton}
                />
                <ShimmerSkeleton
                  width={80}
                  height={12}
                  borderRadius={4}
                  style={styles.dateSkeleton}
                />
              </View>
              <ShimmerSkeleton
                width={24}
                height={24}
                borderRadius={4}
                style={styles.optionsSkeleton}
              />
            </View>

            {/* Quote content */}
            <View style={styles.quoteContainer}>
              <View style={styles.quoteLine} />
              <View style={styles.quoteTextContainer}>
                <ShimmerSkeleton
                  width="90%"
                  height={14}
                  borderRadius={4}
                  style={styles.quoteTextLine}
                />
                <ShimmerSkeleton
                  width="75%"
                  height={14}
                  borderRadius={4}
                  style={styles.quoteTextLine}
                />
              </View>
            </View>

            {/* Bottom arrow */}
            <View style={styles.bottomContainer}>
              <ShimmerSkeleton
                width={24}
                height={24}
                borderRadius={4}
                style={styles.arrowSkeleton}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  cardSkeleton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    shadowColor: '#595959',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconSkeleton: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleSkeleton: {
    marginBottom: 6,
  },
  dateSkeleton: {
    // No additional margin needed
  },
  optionsSkeleton: {
    // No additional margin needed
  },
  quoteContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 8,
  },
  quoteLine: {
    width: 2,
    height: 40,
    backgroundColor: '#2B2B2B',
    marginRight: 12,
    borderRadius: 1,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteTextLine: {
    marginBottom: 6,
  },
  bottomContainer: {
    alignItems: 'flex-end',
  },
  arrowSkeleton: {
    // No additional margin needed
  },
}); 