import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { spacing, borderRadius, shadows } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import CategoryIcon from '../components/CategoryIcon';
import ErrorBanner from '../components/ErrorBanner';
import SwipeableScreen from '../components/SwipeableScreen';

export default function StatsScreen({ navigation }) {
  const colors = useTheme();
  const { settings, dataVersion } = useSettings();
  const { currency } = settings;
  const isDark = settings.theme === 'dark';
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

  const maxTotal = Math.max(...(categories.map(c => c.total)), 1);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 110 },
    // header
    headerRow: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    title: {
      fontSize: 26, fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontSize: 13.5,
      color: colors.textTertiary,
      marginTop: 4,
      textTransform: 'capitalize',
    },
    // hero
    heroCard: {
      marginHorizontal: spacing.lg,
      borderRadius: 28,
      padding: 22,
      paddingBottom: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#233050' : colors.border,
      backgroundColor: isDark ? '#0F1E34' : colors.surface,
      ...shadows.md,
    },
    heroLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.12,
      textTransform: 'uppercase',
      color: colors.textTertiary,
      marginBottom: 6,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 14,
    },
    heroCurrency: {
      fontSize: 26, fontWeight: '400',
      color: colors.textTertiary,
      letterSpacing: -0.5,
    },
    heroAmount: {
      fontSize: 44, fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -2,
      lineHeight: 50,
    },
    miniRow: {
      flexDirection: 'row', gap: 10,
    },
    miniStat: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(10, 18, 34, 0.55)' : colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 12,
      gap: 4,
    },
    miniLabel: {
      fontSize: 10, fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.08,
      textTransform: 'uppercase',
    },
    miniValue: {
      fontSize: 17, fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    // donut
    donutSection: {
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    donutWrapper: {
      width: 240, height: 240,
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    donutLabel: {
      fontSize: 10, fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.08,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    donutTotal: {
      fontSize: 22, fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
    donutSub: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
    },
    // section
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18, fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    sectionMeta: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    // category list card
    listCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
      overflow: 'hidden',
    },
    barRow: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: 8,
    },
    barRowLast: {
      borderBottomWidth: 0,
    },
    barTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    barLeft: {
      flex: 1,
      gap: 2,
    },
    catName: {
      fontSize: 14, fontWeight: '600',
      color: colors.textPrimary,
    },
    catCount: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    barRight: {
      alignItems: 'flex-end',
      gap: 2,
    },
    catAmount: {
      fontSize: 14, fontWeight: '700',
      letterSpacing: -0.3,
    },
    catPct: {
      fontSize: 11, fontWeight: '600',
      color: colors.textTertiary,
    },
    barTrack: {
      height: 6,
      backgroundColor: isDark ? 'rgba(30,50,80,0.6)' : colors.borderLight,
      borderRadius: 3,
      overflow: 'hidden',
      marginLeft: 56,
    },
    barFill: {
      height: '100%', borderRadius: 3,
    },
    // empty
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    // insight
    insightCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.lg,
      marginHorizontal: spacing.lg,
      backgroundColor: colors.primary + '14',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    insightIcon: {
      width: 32, height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '25',
      alignItems: 'center', justifyContent: 'center',
    },
    insightText: {
      flex: 1,
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 19,
    },
  }), [colors, isDark]);

  const totalSpent = summary?.total_spent || 0;

  return (
    <SwipeableScreen navigation={navigation} currentIndex={1} totalTabs={4}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => { setError(null); loadData(); }}
            />
          )}

          {/* header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t.stats.title}</Text>
            <Text style={styles.subtitle}>
              {summary?.month_number ? t.months[summary.month_number] : ''} {summary?.year || ''}
            </Text>
          </View>

          {/* hero card */}
          <View style={styles.heroCard}>
            {/* glow */}
            <View style={{ position: 'absolute', top: -35, right: -35, width: 200, height: 200 }}>
              <Svg width={200} height={200}>
                <Defs>
                  <RadialGradient id="sglow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
                    <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={200} height={200} fill="url(#sglow)" />
              </Svg>
            </View>

            <Text style={styles.heroLabel}>Total del mes</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroCurrency}>{currency.symbol}</Text>
              <Text style={styles.heroAmount}>
                {totalSpent.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </Text>
            </View>

            <View style={styles.miniRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>Promedio diario</Text>
                <Text style={styles.miniValue}>
                  {formatCurrency(summary?.daily_average || 0, currency)}
                </Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniLabel}>Gastos</Text>
                <Text style={styles.miniValue}>{summary?.expense_count || 0}</Text>
              </View>
            </View>
          </View>

          {/* donut */}
          {categories.length > 0 && totalSpent > 0 && (
            <View style={styles.donutSection}>
              <View style={styles.donutWrapper}>
                {(() => {
                  const SIZE = 240, CENTER = SIZE / 2;
                  const STROKE = 26, R = 90;
                  const C = 2 * Math.PI * R;
                  let cum = 0;
                  return (
                    <Svg width={SIZE} height={SIZE}>
                      <Circle
                        cx={CENTER} cy={CENTER} r={R}
                        fill="transparent"
                        stroke={isDark ? 'rgba(30,50,80,0.6)' : colors.borderLight}
                        strokeWidth={STROKE}
                      />
                      {categories.map(cat => {
                        const pct = cat.total / totalSpent;
                        const dash = pct * C;
                        const off = -cum * C;
                        cum += pct;
                        const cc = colors.categories[cat.category] || colors.textTertiary;
                        return (
                          <Circle
                            key={cat.category}
                            cx={CENTER} cy={CENTER} r={R}
                            fill="transparent"
                            stroke={cc}
                            strokeWidth={STROKE}
                            strokeDasharray={`${dash} ${C}`}
                            strokeDashoffset={off}
                            strokeLinecap="butt"
                            transform={`rotate(-90 ${CENTER} ${CENTER})`}
                          />
                        );
                      })}
                    </Svg>
                  );
                })()}
                <View style={styles.donutCenter} pointerEvents="none">
                  <Text style={styles.donutLabel}>Total</Text>
                  <Text style={styles.donutTotal}>
                    {formatCurrency(totalSpent, currency)}
                  </Text>
                  <Text style={styles.donutSub}>
                    {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* by category */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Por categoría</Text>
            {categories.length > 0 && (
              <Text style={styles.sectionMeta}>{categories.length} totales</Text>
            )}
          </View>

          <View style={styles.listCard}>
            {categories.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="pie-chart-outline" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>{t.stats.noData}</Text>
              </View>
            ) : (
              categories.map((cat, i) => {
                const cc = colors.categories[cat.category] || colors.textTertiary;
                const barW = (cat.total / maxTotal) * 100;
                const pct = totalSpent
                  ? ((cat.total / totalSpent) * 100).toFixed(0)
                  : '0';
                const last = i === categories.length - 1;
                return (
                  <View key={cat.category} style={[styles.barRow, last && styles.barRowLast]}>
                    <View style={styles.barTop}>
                      <CategoryIcon
                        category={cat.category}
                        color={cc}
                        size={20}
                        containerSize={42}
                      />
                      <View style={styles.barLeft}>
                        <Text style={styles.catName}>{cat.category}</Text>
                        <Text style={styles.catCount}>
                          {cat.count} {cat.count === 1 ? 'gasto' : 'gastos'}
                        </Text>
                      </View>
                      <View style={styles.barRight}>
                        <Text style={[styles.catAmount, { color: cc }]}>
                          {formatCurrency(cat.total, currency)}
                        </Text>
                        <Text style={styles.catPct}>{pct}%</Text>
                      </View>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${barW}%`, backgroundColor: cc }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* insight */}
          {summary?.top_category && summary.top_category !== 'Ninguna' && (
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <MaterialIcons name="lightbulb" size={18} color={colors.primary} />
              </View>
              <Text style={styles.insightText}>
                {t.stats.topCategory}{' '}
                <Text style={{ fontWeight: '700' }}>{summary.top_category}</Text>
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
