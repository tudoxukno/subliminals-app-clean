import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ShimmerSkeleton } from './ShimmerSkeleton';

const { width } = Dimensions.get('window');

type SubliminalCardSkeletonProps = {
  showQuoteOnly?: boolean;
};

export const SubliminalCardSkeleton: React.FC<SubliminalCardSkeletonProps> = ({
  showQuoteOnly = false,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.archetypeHeader}>
          <ShimmerSkeleton
            width={24}
            height={24}
            borderRadius={4}
            style={styles.iconSkeleton}
          />
          <View style={styles.titleContainer}>
            <ShimmerSkeleton
              width={120}
              height={20}
              borderRadius={4}
              style={styles.titleSkeleton}
            />
            <ShimmerSkeleton
              width={160}
              height={14}
              borderRadius={4}
              style={styles.subtitleSkeleton}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {showQuoteOnly ? (
            // Quote-only skeleton
            <View style={styles.quoteOnlyContainer}>
              <ShimmerSkeleton
                width="90%"
                height={24}
                borderRadius={4}
                style={styles.quoteLine}
              />
              <ShimmerSkeleton
                width="80%"
                height={24}
                borderRadius={4}
                style={styles.quoteLine}
              />
              <ShimmerSkeleton
                width="70%"
                height={24}
                borderRadius={4}
                style={styles.quoteLine}
              />
            </View>
          ) : (
            // Full content skeleton
            <>
              <View style={styles.messageContainer}>
                <ShimmerSkeleton
                  width="100%"
                  height={16}
                  borderRadius={4}
                  style={styles.messageLine}
                />
                <ShimmerSkeleton
                  width="95%"
                  height={16}
                  borderRadius={4}
                  style={styles.messageLine}
                />
                <ShimmerSkeleton
                  width="85%"
                  height={16}
                  borderRadius={4}
                  style={styles.messageLine}
                />
                <ShimmerSkeleton
                  width="90%"
                  height={16}
                  borderRadius={4}
                  style={styles.messageLine}
                />
              </View>
              
              <ShimmerSkeleton
                width="100%"
                height={1}
                borderRadius={0}
                style={styles.dividerSkeleton}
              />
              
              <View style={styles.quoteContainer}>
                <ShimmerSkeleton
                  width="80%"
                  height={20}
                  borderRadius={4}
                  style={styles.quoteLine}
                />
                <ShimmerSkeleton
                  width="60%"
                  height={20}
                  borderRadius={4}
                  style={styles.quoteLine}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 40,
    minHeight: 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
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
    flex: 1,
    padding: 20,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  iconSkeleton: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  subtitleSkeleton: {
    // No additional margin needed
  },
  contentContainer: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageLine: {
    marginBottom: 8,
  },
  dividerSkeleton: {
    marginBottom: 12,
  },
  quoteContainer: {
    alignItems: 'center',
  },
  quoteLine: {
    marginBottom: 8,
  },
  quoteOnlyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
}); 