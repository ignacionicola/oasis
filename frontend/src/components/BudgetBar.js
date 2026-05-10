import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export default function BudgetBar({ category, spent, limit, alertLevel }) {
  const percentage = Math.min((spent / limit) * 100, 100);
  const categoryColor = colors.categories[category] || colors.textTertiary;

  const barColor =
    alertLevel === 'danger' ? colors.danger :
    alertLevel === 'warning' ? colors.warning :
    categoryColor;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.category}>{category}</Text>
        <Text style={[styles.amount, alertLevel === 'danger' && { color: colors.danger }]}>
          ${formatAmount(spent)}
        </Text>
      </View>
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${percentage}%`,
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.percentage, { color: barColor }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
    </View>
  );
}

function formatAmount(value) {
  return value.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  amount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
});
