import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, categoryIcons } from '../theme';
import api from '../services/api';
import ErrorBanner from '../components/ErrorBanner';

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      let [budgetData, summaryData] = await Promise.all([
        api.getBudgets(),
        api.getMonthSummary(now.getMonth() + 1, now.getFullYear()),
      ]);

      if (budgetData.length === 0) {
        try {
          await api.initDefaultBudgets();
          budgetData = await api.getBudgets();
        } catch (initErr) {
          console.warn('No se pudieron inicializar los presupuestos por defecto:', initErr.message);
        }
      }

      setBudgets(budgetData);
      setBudgetStatus(summaryData.budget_status || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveEdit = async (category) => {
    const newLimit = parseFloat(editValue.replace(/[,.]/g, ''));
    if (isNaN(newLimit) || newLimit <= 0) {
      Alert.alert('Monto inválido', 'Ingresá un límite válido.');
      return;
    }
    try {
      await api.createBudget({ category, monthly_limit: newLimit });
      setEditingCategory(null);
      setEditValue('');
      await loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const getStatusForCategory = (category) => {
    return budgetStatus.find(b => b.category === category);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { setError(null); loadData(); }}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Presupuestos</Text>
        <Text style={styles.subtitle}>Límites mensuales por categoría</Text>
      </View>

      {/* Lista de presupuestos */}
      {budgets.length > 0 && (
        <View style={styles.listContainer}>
          {budgets.map((budget) => {
            const catColor = colors.categories[budget.category] || colors.textTertiary;
            const iconName = categoryIcons[budget.category] || 'more-horiz';
            const status = getStatusForCategory(budget.category);
            const isEditing = editingCategory === budget.category;
            const percentage = status ? status.percentage_used : 0;
            const alertColor =
              status?.alert_level === 'danger' ? colors.danger :
              status?.alert_level === 'warning' ? colors.warning :
              colors.success;

            return (
              <View key={budget.category} style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetLeft}>
                    <View style={[styles.budgetIcon, { backgroundColor: catColor + '15' }]}>
                      <MaterialIcons name={iconName} size={20} color={catColor} />
                    </View>
                    <View>
                      <Text style={styles.budgetCategory}>{budget.category}</Text>
                      {status && status.spent > 0 && (
                        <Text style={styles.budgetSpent}>
                          Gastado: ${formatAmount(status.spent)}
                        </Text>
                      )}
                    </View>
                  </View>

                  {isEditing ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={styles.editInput}
                        keyboardType="numeric"
                        value={editValue}
                        onChangeText={setEditValue}
                        placeholder={String(budget.monthly_limit)}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => handleSaveEdit(budget.category)}
                        hitSlop={8}
                      >
                        <MaterialIcons name="check" size={22} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setEditingCategory(null); setEditValue(''); }}
                        hitSlop={8}
                      >
                        <MaterialIcons name="close" size={22} color={colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.limitButton}
                      onPress={() => {
                        setEditingCategory(budget.category);
                        setEditValue(String(Math.round(budget.monthly_limit)));
                      }}
                    >
                      <Text style={styles.limitText}>
                        ${formatAmount(budget.monthly_limit)}
                      </Text>
                      <MaterialIcons name="edit" size={14} color={colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Progress bar */}
                {status && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: alertColor,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressPercent, { color: alertColor }]}>
                      {Math.round(percentage)}%
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Tip */}
      {budgets.length > 0 && (
        <View style={styles.tipCard}>
          <MaterialIcons name="info-outline" size={18} color={colors.info} />
          <Text style={styles.tipText}>
            Tocá el monto de cualquier categoría para editar el límite mensual.
          </Text>
        </View>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

function formatAmount(amount) {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}k`;
  }
  return Math.round(amount).toLocaleString('es-AR');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  listContainer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  budgetItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  budgetIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCategory: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  budgetSpent: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  limitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  limitText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 15,
    fontWeight: '600',
    width: 90,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: colors.primary,
    color: colors.textPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginLeft: 52,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#E6F1FB',
    borderRadius: borderRadius.md,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
