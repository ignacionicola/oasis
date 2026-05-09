import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, categoryIcons } from '../theme';

export default function ExpenseCard({ expense, onPress }) {
  const categoryColor = colors.categories[expense.category] || colors.textTertiary;
  const iconName = categoryIcons[expense.category] || 'more-horiz';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(expense)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: categoryColor + '15' }]}>
        <MaterialIcons name={iconName} size={22} color={categoryColor} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {expense.category}
            </Text>
          </View>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
        </View>
      </View>

      <Text style={styles.amount}>
        ${formatAmount(expense.amount)}
      </Text>
    </TouchableOpacity>
  );
}

function formatAmount(amount) {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[date.getMonth()]}`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  date: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});
