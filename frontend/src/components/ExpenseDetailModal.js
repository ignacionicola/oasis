import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity,
  Modal, StyleSheet, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows, categoryIcons } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';

export default function ExpenseDetailModal({ expense, onClose, onDelete }) {
  const colors = useTheme();
  const { settings } = useSettings();
  const { currency } = settings;
  const t = useTranslation();

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(10, 22, 40, 0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.sm,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    amount: {
      fontSize: 52,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -2,
    },
    detailsCard: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
      ...shadows.sm,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    detailIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailTexts: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textTertiary,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginHorizontal: spacing.md,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: colors.danger,
    },
    deleteText: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: '600',
    },
  }), [colors]);

  if (!expense) return null;

  const categoryColor = colors.categories[expense.category] || colors.textTertiary;
  const iconName = categoryIcons[expense.category] || 'more-horiz';

  const handleDelete = () => {
    Alert.alert(
      t.expenseDetail.confirmDelete,
      t.expenseDetail.confirmDeleteMsg,
      [
        { text: t.expenseDetail.cancel, style: 'cancel' },
        {
          text: t.expenseDetail.delete,
          style: 'destructive',
          onPress: () => onDelete(expense),
        },
      ]
    );
  };

  return (
    <Modal
      visible={!!expense}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{expense.description}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amount}>{formatCurrency(expense.amount, currency)}</Text>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: categoryColor + '15' }]}>
                <MaterialIcons name={iconName} size={18} color={categoryColor} />
              </View>
              <View style={styles.detailTexts}>
                <Text style={styles.detailLabel}>Categoría</Text>
                <Text style={[styles.detailValue, { color: categoryColor }]}>
                  {expense.category}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="calendar-today" size={18} color={colors.primary} />
              </View>
              <View style={styles.detailTexts}>
                <Text style={styles.detailLabel}>Fecha</Text>
                <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
              </View>
            </View>

            {expense.source && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.accentLight }]}>
                    <MaterialIcons name="input" size={18} color={colors.accent} />
                  </View>
                  <View style={styles.detailTexts}>
                    <Text style={styles.detailLabel}>Origen</Text>
                    <Text style={styles.detailValue}>{capitalize(expense.source)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
            <Text style={styles.deleteText}>{t.expenseDetail.delete}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
