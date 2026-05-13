import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { spacing, borderRadius, shadows, categoryIcons } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import ErrorBanner from '../components/ErrorBanner';
import SwipeableScreen from '../components/SwipeableScreen';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen({ navigation }) {
  const colors = useTheme();
  const { settings, dataVersion } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, dataVersion]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  };

  const maxTotal = Math.max(...categories.map(c => c.total), 1);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: spacing.xxl,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
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
    donutSection: {
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    donutWrapper: {
      width: 260,
      height: 260,
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutTotal: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    donutLabel: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
      textTransform: 'lowercase',
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
  }), [colors]);

  return (
    <SwipeableScreen navigation={navigation} currentIndex={1} totalTabs={4}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => { setError(null); loadData(); }}
          />
        )}

        <View style={styles.header}>
          <Text style={styles.title}>{t.stats.title}</Text>
          <Text style={styles.subtitle}>
            {summary?.month_number ? t.months[summary.month_number] : ''} {summary?.year || ''}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {summary ? formatCurrency(summary.total_spent, currency) : '—'}
            </Text>
            <Text style={styles.statLabel}>{t.stats.totalSpent}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {summary ? formatCurrency(summary.daily_average, currency) : '—'}
            </Text>
            <Text style={styles.statLabel}>{t.stats.dailyAverage}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary?.expense_count || 0}</Text>
            <Text style={styles.statLabel}>{t.stats.expenses}</Text>
          </View>
        </View>

        {categories.length > 0 && summary?.total_spent > 0 && (
          <View style={styles.donutSection}>
            <View style={styles.donutWrapper}>
              {(() => {
                const SIZE = 260;
                const CENTER = SIZE / 2;
                const STROKE_WIDTH = 30;
                const R = 95;
                const C = 2 * Math.PI * R;
                let cumulative = 0;
                return (
                  <Svg width={SIZE} height={SIZE}>
                    <Circle
                      cx={CENTER}
                      cy={CENTER}
                      r={R}
                      fill="transparent"
                      stroke={colors.borderLight}
                      strokeWidth={STROKE_WIDTH}
                    />
                    {categories.map((cat) => {
                      const pct = cat.total / summary.total_spent;
                      const dashLength = pct * C;
                      const offset = -cumulative * C;
                      cumulative += pct;
                      const catColor = colors.categories[cat.category] || colors.textTertiary;
                      return (
                        <Circle
                          key={cat.category}
                          cx={CENTER}
                          cy={CENTER}
                          r={R}
                          fill="transparent"
                          stroke={catColor}
                          strokeWidth={STROKE_WIDTH}
                          strokeDasharray={`${dashLength} ${C}`}
                          strokeDashoffset={offset}
                          strokeLinecap="butt"
                          transform={`rotate(-90 ${CENTER} ${CENTER})`}
                        />
                      );
                    })}
                  </Svg>
                );
              })()}
              <View style={styles.donutCenter} pointerEvents="none">
                <Text style={styles.donutTotal}>
                  {formatCurrency(summary.total_spent, currency)}
                </Text>
                <Text style={styles.donutLabel}>total</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.stats.byCategory}</Text>
          <View style={styles.chartCard}>
            {categories.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="pie-chart-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>{t.stats.noData}</Text>
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
                        <Text style={styles.barCount}>
                          {cat.count} {t.stats.expenses.toLowerCase()}
                        </Text>
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
                        {formatCurrency(cat.total, currency)}
                      </Text>
                      <Text style={styles.barPercentage}>{percentage}%</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {summary?.top_category && summary.top_category !== 'Ninguna' && (
          <View style={styles.insightCard}>
            <MaterialIcons name="lightbulb-outline" size={20} color={colors.accent} />
            <Text style={styles.insightText}>
              {t.stats.topCategory}{' '}
              <Text style={{ fontWeight: '600' }}>{summary.top_category}</Text>
              {summary.by_category?.[summary.top_category] && (
                <Text>
                  {' '}({formatCurrency(summary.by_category[summary.top_category], currency)})
                </Text>
              )}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </SwipeableScreen>
  );
}
