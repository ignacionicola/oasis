import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { spacing, borderRadius, shadows, fonts } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import CategoryIcon from '../components/CategoryIcon';
import ErrorBanner from '../components/ErrorBanner';
import SwipeableScreen from '../components/SwipeableScreen';

// Animated bar with scaleY stagger
function MonthBar({ height, color, delay, isCurrent }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        width: '100%',
        height: anim.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
        backgroundColor: color,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        ...(isCurrent && {
          shadowColor: color,
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }),
      }}
    />
  );
}

function MonthlyView({ monthlyData, colors, isDark, currency, styles, t }) {
  if (!monthlyData.length) return null;

  const maxVal = Math.max(...monthlyData.map(m => m.total), 1);
  const monthsAbbr = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

  const fmtK = (n) => {
    if (n === 0) return '—';
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
    return n.toFixed(0);
  };

  // Reverse-chronological list with delta
  const listData = [...monthlyData].reverse().map((m, i, arr) => {
    const prev = arr[i + 1];
    let delta = null;
    if (prev && prev.total > 0) {
      const pct = ((m.total - prev.total) / prev.total) * 100;
      delta = { pct: Math.abs(pct).toFixed(1), up: pct > 0 };
    }
    return { ...m, delta };
  });

  return (
    <>
      <View style={styles.barsCard}>
        <Text style={styles.barsHeaderLabel}>Comparativo últimos 6 meses</Text>
        <View style={styles.barsRow}>
          {monthlyData.map((m, i) => {
            const isCurrent = i === monthlyData.length - 1;
            const heightPct = (m.total / maxVal) * 130;
            const barColor = isCurrent
              ? colors.primary
              : (isDark ? '#283450' : '#D8DFE6');
            return (
              <View key={`${m.month}-${m.year}`} style={styles.barCol}>
                <Text style={styles.barKValue}>{fmtK(m.total)}</Text>
                <MonthBar
                  height={Math.max(heightPct, 6)}
                  color={barColor}
                  delay={i * 60}
                  isCurrent={isCurrent}
                />
                <Text style={[styles.barMonth, isCurrent && styles.barMonthActive]}>
                  {monthsAbbr[m.month - 1]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Monthly list */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Por mes</Text>
      </View>
      <View style={styles.listCard}>
        {listData.map((m, i) => {
          const last = i === listData.length - 1;
          return (
            <View
              key={`${m.month}-${m.year}`}
              style={[styles.monthlyRow, last && { borderBottomWidth: 0 }]}
            >
              <View style={styles.monthlyLeft}>
                <Text style={styles.monthlyName}>
                  {t.months[m.month]} {m.year}
                </Text>
                <Text style={styles.monthlyCount}>
                  {m.count} {m.count === 1 ? 'movimiento' : 'movimientos'}
                </Text>
              </View>
              <View style={styles.monthlyRight}>
                <Text style={styles.monthlyAmount}>
                  {formatCurrency(m.total, currency)}
                </Text>
                {m.delta && (
                  <View style={styles.monthlyDeltaRow}>
                    <MaterialIcons
                      name={m.delta.up ? 'arrow-upward' : 'arrow-downward'}
                      size={11}
                      color={m.delta.up ? colors.danger : colors.success}
                    />
                    <Text style={[
                      styles.monthlyDelta,
                      { color: m.delta.up ? colors.danger : colors.success },
                    ]}>
                      {m.delta.pct}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

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
  const [view, setView] = useState('category'); // 'category' | 'month'
  const [monthlyData, setMonthlyData] = useState([]); // array of {month, year, total, count}

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

      // Load last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(y, m - 1 - i, 1);
        months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }
      const monthlyResults = await Promise.all(
        months.map(({ month, year }) =>
          api.getMonthSummary(month, year)
            .then(s => ({ month, year, total: s.total_spent || 0, count: s.expense_count || 0 }))
            .catch(() => ({ month, year, total: 0, count: 0 }))
        )
      );
      setMonthlyData(monthlyResults);
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
      fontFamily: fonts.displayBold,
      fontSize: 26,
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontSize: 13.5,
      color: colors.textTertiary,
      marginTop: 4,
      textTransform: 'capitalize',
    },
    // segmented control
    segmented: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      padding: 4,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      borderRadius: borderRadius.full,
    },
    segBtnActive: {
      backgroundColor: colors.primary + '18',
      borderWidth: 1,
      borderColor: colors.primary + '50',
    },
    segText: {
      fontFamily: fonts.sansSemi,
      fontSize: 13,
      color: colors.textTertiary,
    },
    segTextActive: {
      color: colors.primary,
      fontFamily: fonts.sansBold,
    },
    // monthly bar chart
    barsCard: {
      marginHorizontal: spacing.lg,
      borderRadius: 22,
      padding: spacing.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#233050' : colors.border,
      backgroundColor: isDark ? '#0F1E34' : colors.surface,
      ...shadows.md,
    },
    barsHeaderLabel: {
      fontFamily: fonts.sansBold,
      fontSize: 10.5,
      letterSpacing: 0.14,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      marginBottom: spacing.md,
    },
    barsRow: {
      flexDirection: 'row',
      height: 160,
      alignItems: 'flex-end',
      gap: 8,
      marginTop: 4,
    },
    barCol: {
      flex: 1,
      alignItems: 'center',
      gap: 5,
    },
    barKValue: {
      fontFamily: fonts.monoSemi,
      fontSize: 10.5,
      color: colors.textTertiary,
    },
    barShape: {
      width: '100%',
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    barMonth: {
      fontFamily: fonts.sansSemi,
      fontSize: 10,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      marginTop: 4,
    },
    barMonthActive: {
      color: colors.primary,
      fontFamily: fonts.sansBold,
    },
    // monthly list
    monthlyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    monthlyLeft: {
      flex: 1, gap: 3,
    },
    monthlyName: {
      fontFamily: fonts.sansSemi,
      fontSize: 14.5,
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    monthlyCount: {
      fontFamily: fonts.sans,
      fontSize: 11.5,
      color: colors.textTertiary,
    },
    monthlyRight: {
      alignItems: 'flex-end', gap: 3,
    },
    monthlyAmount: {
      fontFamily: fonts.monoSemi,
      fontSize: 14,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    monthlyDeltaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    monthlyDelta: {
      fontFamily: fonts.sansBold,
      fontSize: 11,
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
      fontFamily: fonts.displayMedium,
      fontSize: 26,
      color: colors.textTertiary,
      letterSpacing: -0.5,
    },
    heroAmount: {
      fontFamily: fonts.displayBold,
      fontSize: 48,
      color: colors.textPrimary,
      letterSpacing: -2,
      lineHeight: 54,
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
      fontFamily: fonts.display,
      fontSize: 17,
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
      fontFamily: fonts.displayBold,
      fontSize: 22,
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
      fontFamily: fonts.display,
      fontSize: 18,
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
      fontFamily: fonts.monoSemi,
      fontSize: 13,
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

          {/* Segmented control */}
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segBtn, view === 'category' && styles.segBtnActive]}
              onPress={() => setView('category')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segText, view === 'category' && styles.segTextActive]}>
                Por categoría
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, view === 'month' && styles.segBtnActive]}
              onPress={() => setView('month')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segText, view === 'month' && styles.segTextActive]}>
                Mes a mes
              </Text>
            </TouchableOpacity>
          </View>

          {view === 'month' && (
            <MonthlyView
              monthlyData={monthlyData}
              colors={colors}
              isDark={isDark}
              currency={currency}
              styles={styles}
              t={t}
            />
          )}

          {view === 'category' && (
          <>
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
          </>
          )}
        </ScrollView>
      </SafeAreaView>
    </SwipeableScreen>
  );
}
