import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import CategoryIcon from './CategoryIcon';

export default function ExpenseCard({ expense, onPress }) {
  const colors = useTheme();
  const { settings } = useSettings();
  const { currency } = settings;
  const categoryColor = colors.categories[expense.category] || colors.textTertiary;

  const styles = useMemo(() => StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
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
  }), [colors]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(expense)}
      activeOpacity={0.7}
    >
      <CategoryIcon category={expense.category} color={categoryColor} size={22} containerSize={44} />

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
        {formatCurrency(expense.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                   'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[date.getMonth()]}`;
}
