import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from './Skeleton';

export const HomeLoadingSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton width={150} height={24} />
        <Skeleton width={100} height={20} style={styles.subtitle} />
      </View>

      {/* Rank Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.rankContent}>
          <View>
            <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Skeleton width={20} height={24} style={{ marginRight: 4 }} />
              <Skeleton width={40} height={32} />
              <Skeleton width={30} height={14} style={{ marginLeft: 8 }} />
            </View>
            <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
          </View>
          <Skeleton width={80} height={36} borderRadius={12} />
        </View>
      </View>

      {/* Circular Progress Skeleton - effectively part of Attendance in user's mind but separated here */}
      <View style={styles.progressCard}>
        <Skeleton width={180} height={180} borderRadius={90} style={styles.circle} />
        <Skeleton width={120} height={24} style={styles.progressLabel} />
      </View>

      {/* Attendance Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Skeleton width={100} height={20} />
          <Skeleton width={60} height={18} />
        </View>
        <View style={styles.divider} />

        {/* Subject rows */}
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.subjectRow}>
            <Skeleton width="60%" height={16} />
            <Skeleton width={50} height={16} />
          </View>
        ))}
      </View>

      {/* Midmarks Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Skeleton width={100} height={20} />
          <Skeleton width={60} height={18} />
        </View>
        <View style={styles.divider} />

        {/* Subject rows */}
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.subjectRow}>
            <Skeleton width="50%" height={16} />
            <View style={styles.marksRow}>
              <Skeleton width={35} height={16} style={styles.mark} />
              <Skeleton width={35} height={16} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
  },
  progressCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  circle: {
    marginBottom: 16,
  },
  progressLabel: {
    marginTop: 8,
  },
  card: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  marksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mark: {
    marginRight: 8,
  },
});
