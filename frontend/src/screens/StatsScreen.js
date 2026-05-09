import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, categoryIcons } from '../theme';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const m = now.getMonth() + 1;
      const y = now.getFullYear();
      const [cats, sum] = await Promise.all([
        api.getCategoriesBreakdown(m, y),
        api.getMonthSummary(m, y),
      ]);
      setCategories(cats);
      setSummary(sum);
    } catch (err) {
      console.warn('Error cargando stats:', err.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const maxTotal = Math.max(...categories.map(c => c.total), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>
          {summary?.month || ''} {summary?.year || ''}
        </Text>
      </View>

      {/* Resumen rápido */}
      <View style={styles.summaryRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ${summary ? formatK(summary.total_spent) : '—'}
          </Text>
          <Text style={styles.statLabel}>Total gastado</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ${summary ? formatK(summary.daily_average) : '—'}
          </Text>
          <Text style={styles.statLabel}>Promedio diario</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{summary?.expense_count || 0}</Text>
          <Text style={styles.statLabel}>Gastos</Text>
        </View>
      </View>

      {/* Gráfico de barras horizontal por categoría */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gasto por categoría</Text>
        <View style={styles.chartCard}>
          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="pie-chart-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Sin datos este mes</Text>
            </View>
          ) : (
            categories.map((cat) => {
              const catColor = colors.categories[cat.category] || colors.textTertiary;
              const iconName = categoryIcons[cat.category] || 'more-horiz';
              const barWidth = (cat.total / maxTotal) * 100;
              const percentage = summary?.total_spent
                ? ((cat.total / summary.total_spent) * 100).toFixed(0)
                : 0;

              return (
                <View key={cat.category} style={styles.barRow}>
                  <View style={styles.barLabel}>
                    <View style={[styles.barIcon, { backgroundColor: catColor + '15' }]}>
                      <MaterialIcons name={iconName} size={16} color={catColor} />
                    </View>
                    <View style={styles.barLabelText}>
                      <Text style={styles.barCategory}>{cat.category}</Text>
                      <Text style={styles.barCount}>{cat.count} gastos</Text>
                    </View>
                  </View>
                  <View style={styles.barTrackContainer}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${barWidth}%`, backgroundColor: catColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barAmount, { color: catColor }]}>
                      ${formatK(cat.total)}
                    </Text>
                    <Text style={styles.barPercentage}>{percentage}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Top categoría */}
      {summary?.top_category && summary.top_category !== 'Ninguna' && (
        <View style={styles.insightCard}>
          <MaterialIcons name="lightbulb-outline" size={20} color={colors.accent} />
          <Text style={styles.insightText}>
            Tu mayor gasto este mes fue en{' '}
            <Text style={{ fontWeight: '600' }}>{summary.top_category}</Text>
            {summary.by_category?.[summary.top_category] && (
              <Text>
                {' '}(${formatK(summary.by_category[summary.top_category])})
              </Text>
            )}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function formatK(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toLocaleString('es-AR');
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.sm,
  },
  barRow: {
    gap: spacing.sm,
  },
  barLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barLabelText: {
    flex: 1,
  },
  barCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  barCount: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  barTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: 40,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barAmount: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  barPercentage: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
    minWidth: 30,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
