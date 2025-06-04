import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface DailyLimitNotificationProps {
  remainingUses: number;
  totalLimit: number;
  timeUntilReset: {
    hours: number;
    minutes: number;
  };
  onUpgrade: () => void;
  style?: object;
}

export const DailyLimitNotification: React.FC<DailyLimitNotificationProps> = ({
  remainingUses,
  totalLimit,
  timeUntilReset,
  onUpgrade,
  style,
}) => {
  const usedCount = totalLimit - remainingUses;
  const isAtLimit = remainingUses === 0;
  const isCloseToLimit = remainingUses === 1;

  // Don't show if they haven't used any yet
  if (usedCount === 0) return null;

  const getNotificationMessage = () => {
    if (isAtLimit) {
      return {
        title: 'Daily Limit Reached',
        subtitle: `You've used all ${totalLimit} free subliminals today`,
        description: 'Upgrade to get unlimited subliminals, or wait for reset.',
        color: '#FF6B6B',
        icon: 'ban' as const,
      };
    }
    
    if (isCloseToLimit) {
      return {
        title: 'Last Free Subliminal',
        subtitle: `${remainingUses} of ${totalLimit} remaining today`,
        description: 'Consider upgrading for unlimited access.',
        color: '#FFA726',
        icon: 'warning' as const,
      };
    }

    return {
      title: 'Daily Usage',
      subtitle: `${remainingUses} of ${totalLimit} remaining today`,
      description: 'Upgrade for unlimited subliminals.',
      color: '#4CAF50',
      icon: 'information-circle' as const,
    };
  };

  const getResetTimeText = () => {
    const { hours, minutes } = timeUntilReset;
    
    if (hours === 0 && minutes === 0) {
      return 'Resets momentarily';
    }
    
    if (hours === 0) {
      return `Resets in ${minutes}m`;
    }
    
    if (minutes === 0) {
      return `Resets in ${hours}h`;
    }
    
    return `Resets in ${hours}h ${minutes}m`;
  };

  const notification = getNotificationMessage();
  const progressPercentage = (usedCount / totalLimit) * 100;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[`${notification.color}20`, `${notification.color}10`]}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          {/* Icon and Title */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={notification.icon} 
                size={20} 
                color={notification.color} 
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.subtitle}>{notification.subtitle}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: notification.color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {usedCount}/{totalLimit}
            </Text>
          </View>

          {/* Reset Time and Action */}
          <View style={styles.footer}>
            <Text style={styles.resetTime}>{getResetTimeText()}</Text>
            
            {isAtLimit && (
              <TouchableOpacity 
                style={[styles.upgradeButton, { backgroundColor: notification.color }]}
                onPress={onUpgrade}
                activeOpacity={0.8}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          {!isAtLimit && (
            <Text style={styles.description}>{notification.description}</Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientBackground: {
    padding: 16,
  },
  content: {
    gap: 12,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetTime: {
    color: '#999',
    fontSize: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Description
  description: {
    color: '#bbb',
    fontSize: 12,
    lineHeight: 16,
  },
}); 