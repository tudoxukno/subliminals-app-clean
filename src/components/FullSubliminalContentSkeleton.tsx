import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from './ShimmerSkeleton';

export const FullSubliminalContentSkeleton: React.FC = () => {
  return (
    <View style={styles.content}>
      {/* Original User Prompt Skeleton */}
      <View style={styles.promptContainer}>
        <ShimmerSkeleton
          width={120}
          height={14}
          borderRadius={4}
          style={styles.promptLabel}
        />
        <ShimmerSkeleton
          width="90%"
          height={32}
          borderRadius={4}
          style={styles.promptLine}
        />
        <ShimmerSkeleton
          width="70%"
          height={32}
          borderRadius={4}
          style={styles.promptLine}
        />
      </View>

      {/* Divider */}
      <ShimmerSkeleton
        width="100%"
        height={1}
        borderRadius={0}
        style={styles.divider}
      />

      {/* Archetype Header Skeleton */}
      <View style={styles.archetypeHeader}>
        <ShimmerSkeleton
          width={32}
          height={32}
          borderRadius={4}
          style={styles.archetypeIcon}
        />
        <View style={styles.archetypeTitleContainer}>
          <ShimmerSkeleton
            width={140}
            height={24}
            borderRadius={4}
            style={styles.archetypeTitle}
          />
          <ShimmerSkeleton
            width={180}
            height={14}
            borderRadius={4}
            style={styles.archetypeSubtitle}
          />
        </View>
      </View>

      {/* Main Message Skeleton */}
      <View style={styles.messageContainer}>
        <ShimmerSkeleton
          width="100%"
          height={17}
          borderRadius={4}
          style={styles.messageLine}
        />
        <ShimmerSkeleton
          width="95%"
          height={17}
          borderRadius={4}
          style={styles.messageLine}
        />
        <ShimmerSkeleton
          width="88%"
          height={17}
          borderRadius={4}
          style={styles.messageLine}
        />
        <ShimmerSkeleton
          width="92%"
          height={17}
          borderRadius={4}
          style={styles.messageLine}
        />
        <ShimmerSkeleton
          width="85%"
          height={17}
          borderRadius={4}
          style={styles.messageLine}
        />
        <ShimmerSkeleton
          width="90%"
          height={17}
          borderRadius={4}
          style={styles.messageLine}
        />
      </View>

      {/* Divider */}
      <ShimmerSkeleton
        width="100%"
        height={1}
        borderRadius={0}
        style={styles.divider}
      />

      {/* Quote Skeleton */}
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
    marginBottom: 8,
  },
  promptLine: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 32,
  },
  archetypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  archetypeIcon: {
    marginRight: 16,
  },
  archetypeTitleContainer: {
    flex: 1,
  },
  archetypeTitle: {
    marginBottom: 8,
  },
  archetypeSubtitle: {
    // No additional margin needed
  },
  messageContainer: {
    marginBottom: 32,
  },
  messageLine: {
    marginBottom: 8,
  },
  quoteContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  quoteLine: {
    marginBottom: 8,
  },
}); 