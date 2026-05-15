import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView,
  StyleSheet, RefreshControl, Alert, StatusBar, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Rect, Defs, RadialGradient, Stop, Path } from 'react-native-svg';
import { spacing, borderRadius, shadows, fonts } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import CategoryIcon from '../components/CategoryIcon';
import BudgetBar from '../components/BudgetBar';
import BottomSheet from '../components/BottomSheet';
import IncomesModal from '../components/IncomesModal';
import ExpenseDetailModal from '../components/ExpenseDetailModal';
import ErrorBanner from '../components/ErrorBanner';

// ── Trend icons ───────────────────────────────────────────────────────────────
function TrendUp({ size = 12, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 18l7-7 4 4 6-7M15 8h5v5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function TrendDown({ size = 12, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6l7 7 4-4 6 7M15 16h5v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── ExpenseRow ─────────────────────────────────────────────────────────────────
function ExpenseRow({ expense, colors, currency, t, lang, onPress, flash }) {
  const catColor = colors.categories[expense.category] || colors.textTertiary;
  const catLabel = t?.categories?.[expense.category] || expense.category;
  const bgAnim = useRef(new Animated.Value(flash ? 1 : 0)).current;

  useEffect(() => {
    if (flash) {
      bgAnim.setValue(1);
      Animated.timing(bgAnim, {
        toValue: 0,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [flash, bgAnim]);

  const bg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', colors.primary + '33'],
  });

  return (
    <Animated.View
      style={{
        backgroundColor: bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
    <TouchableOpacity
      onPress={() => onPress?.(expense)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
      }}
    >
      <CategoryIcon category={expense.category} color={catColor} size={22} containerSize={44} />

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 }}
        >
          {expense.description}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* category chip */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 8, paddingVertical: 3,
            backgroundColor: catColor + '18',
            borderRadius: 999,
          }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: catColor }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>
              {catLabel}
            </Text>
          </View>
          <Text style={{ fontSize: 11.5, color: colors.textQuaternary }}>
            {formatDate(expense.date, lang)}
          </Text>
        </View>
      </View>

      <Text style={{ fontFamily: fonts.monoSemi, fontSize: 15, color: colors.textPrimary, letterSpacing: -0.3 }}>
        -{formatCurrency(expense.amount, currency)}
      </Text>
    </TouchableOpacity>
    </Animated.View>
  );
}

function formatDate(dateStr, lang = 'es') {
  const d = new Date(dateStr + 'T00:00:00');
  const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthsEn = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const months = lang === 'en' ? monthsEn : monthsEs;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// ── MiniStat card ─────────────────────────────────────────────────────────────
function MiniStat({ label, value, dir, color, colors, currency, isDark, onPress }) {
  const Icon = dir === 'up' ? TrendUp : TrendDown;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgba(10, 18, 34, 0.55)' : colors.surfaceElevated,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? colors.borderLight : colors.border,
        padding: 12,
        paddingLeft: 14,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon size={11} color={color} />
        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textTertiary, letterSpacing: 0.08 }}>
          {label.toUpperCase()}
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary, letterSpacing: -0.3 }}>
        {formatCurrency(value, currency)}
      </Text>
    </TouchableOpacity>
  );
}

// ── QuickAction ───────────────────────────────────────────────────────────────
function QuickAction({ icon, label, primary, colors, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: primary ? colors.primary : colors.surface,
        borderRadius: borderRadius.full,
        borderWidth: primary ? 0 : 1,
        borderColor: colors.border,
        flexShrink: 0,
        ...shadows.sm,
      }}
    >
      {icon}
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: primary ? colors.textInverse : colors.textPrimary,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const colors = useTheme();
  const { settings, incrementDataVersion, dataVersion } = useSettings();
  const { currency } = settings;
  const isDark = settings.theme === 'dark';
  const t = useTranslation();

  const [summary, setSummary] = useState(null);
  const [prevSummary, setPrevSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState('expense');
  const [incomesModalVisible, setIncomesModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [error, setError] = useState(null);
  const [flashId, setFlashId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const curM = now.getMonth() + 1;
      const curY = now.getFullYear();
      const prevM = curM === 1 ? 12 : curM - 1;
      const prevY = curM === 1 ? curY - 1 : curY;
      const [summaryData, expenseData, prevData] = await Promise.all([
        api.getMonthSummary(curM, curY),
        api.getExpenses({ month: curM, year: curY }),
        api.getMonthSummary(prevM, prevY).catch(() => null),
      ]);
      setSummary(summaryData);
      setExpenses(expenseData);
      setPrevSummary(prevData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, dataVersion]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  };

  // Overall budget computed from category budgets
  const { totalBudgetLimit, budgetPct, budgetColor, daysRemaining } = useMemo(() => {
    const limit = summary?.budget_status?.reduce((s, b) => s + (b.monthly_limit || 0), 0) || 0;
    const pct = limit > 0 ? Math.min(100, Math.round(((summary?.total_spent || 0) / limit) * 100)) : 0;
    const color = pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.primary;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remaining = daysInMonth - now.getDate();
    return { totalBudgetLimit: limit, budgetPct: pct, budgetColor: color, daysRemaining: remaining };
  }, [summary, colors]);

  const openSheet = (type) => {
    setSheetType(type);
    setSheetVisible(true);
  };

  // ── FAB animations ─────────────────────────────────────────────────────────
  const fabPulse = useRef(new Animated.Value(0)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fabPulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fabPulse]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fabRotate, {
        toValue: sheetVisible ? 1 : 0,
        stiffness: 200, damping: 18, mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: sheetVisible ? 0.92 : 1,
        stiffness: 200, damping: 18,
        useNativeDriver: true,
      }),
    ]).start();
  }, [sheetVisible, fabRotate, fabScale]);

  const fabRotateInterpolate = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });
  const fabPulseScale = fabPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });
  const fabPulseOpacity = fabPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  const handleAddExpense = async (data) => {
    const result = await api.createExpense(data);
    incrementDataVersion();
    await loadData();
    if (result?.id) {
      setFlashId(result.id);
      setTimeout(() => setFlashId(null), 2000);
    }
  };

  const handleAddIncome = async (data) => {
    await api.createIncome(data);
    incrementDataVersion();
    await loadData();
  };

  const handleDeleteExpense = async (expense) => {
    try {
      await api.deleteExpense(expense.id);
      setSelectedExpense(null);
      incrementDataVersion();
      await loadData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // ── hero values ──────────────────────────────────────────────────────────────
  const hasIncome = (summary?.total_income || 0) > 0;
  const heroAmount = hasIncome ? Math.abs(summary.available) : (summary?.total_spent || 0);
  const heroAmountColor = hasIncome
    ? (summary.available >= 0 ? colors.primary : colors.danger)
    : colors.textPrimary;

  // Trend vs prior month (based on spending — less spending is positive)
  const trend = useMemo(() => {
    if (!summary || !prevSummary || !prevSummary.total_spent) return null;
    const diff = summary.total_spent - prevSummary.total_spent;
    const pct = (diff / prevSummary.total_spent) * 100;
    // less spent = positive (good)
    return { pct: Math.abs(pct), down: diff < 0 };
  }, [summary, prevSummary]);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    list: { paddingBottom: 110 },
    // header
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    logoBadge: {
      width: 28, height: 28,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoBadgeText: {
      fontFamily: fonts.displayBold,
      color: colors.textInverse,
      fontSize: 15,
    },
    logoLabel: {
      fontFamily: fonts.sansBold,
      fontSize: 12,
      color: colors.textSecondary,
      letterSpacing: 0.2,
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
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    heroEyebrow: {
      fontFamily: fonts.sansBold,
      fontSize: 11,
      letterSpacing: 0.12,
      textTransform: 'uppercase',
      color: isDark ? 'rgba(180,200,220,0.6)' : colors.textTertiary,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      backgroundColor: isDark ? 'rgba(22,40,64,0.9)' : colors.borderLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
    },
    heroBadgeText: {
      fontFamily: fonts.sansBold,
      fontSize: 11,
      color: colors.success,
    },
    heroAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginBottom: 16,
    },
    heroCurrency: {
      fontFamily: fonts.displayMedium,
      fontSize: 28,
      color: isDark ? 'rgba(180,200,220,0.55)' : colors.textTertiary,
      letterSpacing: -0.5,
    },
    heroAmount: {
      fontFamily: fonts.displayBold,
      fontSize: 60,
      letterSpacing: -2.5,
      lineHeight: 66,
    },
    heroMetaRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: spacing.md,
    },
    // budget
    budgetCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    budgetTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    budgetTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    budgetSubtitle: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    budgetPct: {
      fontFamily: fonts.displayBold,
      fontSize: 26,
      letterSpacing: -1,
    },
    budgetTrack: {
      height: 8,
      backgroundColor: isDark ? 'rgba(30,50,80,0.6)' : colors.borderLight,
      borderRadius: 4,
      overflow: 'hidden',
    },
    budgetFill: {
      height: '100%',
      borderRadius: 4,
    },
    budgetFootRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    budgetFootText: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    // quick actions
    quickActionsScroll: {
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    quickActionsContent: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: spacing.lg,
    },
    // section
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.displayBold,
      fontSize: 22,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewAllText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    expenseListCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    // empty
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl * 2,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingHorizontal: spacing.xl,
    },
    // fab
    fabWrap: {
      position: 'absolute',
      bottom: 92,
      right: 22,
      width: 60, height: 60,
      alignItems: 'center', justifyContent: 'center',
    },
    fabRing: {
      position: 'absolute',
      width: 60, height: 60,
      borderRadius: 30,
    },
    fab: {
      width: 60, height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.md,
      shadowColor: colors.primary,
      shadowOpacity: 0.45,
      elevation: 8,
    },
  }), [colors, isDark]);

  const renderHeader = () => {
    const now = new Date();
    const monthName = summary?.month_number ? t.months[summary.month_number] : '';
    const yr = summary?.year || now.getFullYear();

    return (
      <View>
        {/* ── App header ───────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeText}>P</Text>
              </View>
              <Text style={styles.logoLabel}>Plata · {monthName} {yr}</Text>
            </View>
          </View>
        </View>

        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          {/* Gradient overlay (top: dark green tint) */}
          {isDark && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: 28,
            }}>
              {/* green tint — full card */}
              <View style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(18, 45, 20, 0.55)',
                borderRadius: 28,
              }} />
            </View>
          )}

          {/* Radial glow — top-right */}
          <View style={{ position: 'absolute', top: -35, right: -35, width: 200, height: 200 }}>
            <Svg width={200} height={200}>
              <Defs>
                <RadialGradient id="hglow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.2" />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={200} height={200} fill="url(#hglow)" />
            </Svg>
          </View>

          {/* Top row: eyebrow + optional badge */}
          <View style={styles.heroTopRow}>
            <Text style={styles.heroEyebrow}>
              {hasIncome ? t.home.availableThisMonth : t.home.spentThisMonth}
            </Text>
            {trend && trend.pct >= 0.5 ? (
              <View style={[
                styles.heroBadge,
                { borderColor: (trend.down ? colors.success : colors.danger) + '50' },
              ]}>
                {trend.down
                  ? <TrendDown size={11} color={colors.success} />
                  : <TrendUp size={11} color={colors.danger} />}
                <Text style={[
                  styles.heroBadgeText,
                  { color: trend.down ? colors.success : colors.danger },
                ]}>
                  {trend.down ? '−' : '+'}{trend.pct.toFixed(1)}%
                </Text>
              </View>
            ) : summary && (
              <View style={styles.heroBadge}>
                <TrendUp size={11} color={colors.success} />
                <Text style={styles.heroBadgeText}>
                  {t.home.expensesCount.replace('{n}', summary.expense_count || 0)}
                </Text>
              </View>
            )}
          </View>

          {/* Balance amount */}
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroCurrency}>{currency.symbol}</Text>
            <Text style={[styles.heroAmount, { color: heroAmountColor }]}>
              {heroAmount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </Text>
          </View>

          {/* Mini stats */}
          <View style={styles.heroMetaRow}>
            <MiniStat
              label={t.home.incomeLabel}
              value={summary?.total_income || 0}
              dir="up"
              color={colors.success}
              colors={colors}
              currency={currency}
              isDark={isDark}
              onPress={() => setIncomesModalVisible(true)}
            />
            <MiniStat
              label={t.home.spentLabel}
              value={summary?.total_spent || 0}
              dir="down"
              color={colors.danger}
              colors={colors}
              currency={currency}
              isDark={isDark}
            />
          </View>
        </View>

        {/* ── Budget card ──────────────────────────────────────────────── */}
        {totalBudgetLimit > 0 && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetTopRow}>
              <View>
                <Text style={styles.budgetTitle}>{t.home.budgetMonthly}</Text>
                <Text style={styles.budgetSubtitle}>
                  {formatCurrency(summary?.total_spent || 0, currency)} / {formatCurrency(totalBudgetLimit, currency)}
                </Text>
              </View>
              <Text style={[styles.budgetPct, { color: budgetColor }]}>{budgetPct}%</Text>
            </View>
            <View style={styles.budgetTrack}>
              <View style={[styles.budgetFill, { width: `${budgetPct}%`, backgroundColor: budgetColor }]} />
            </View>
            <View style={styles.budgetFootRow}>
              <Text style={styles.budgetFootText}>
                {t.home.dailyAverageDot} · {formatCurrency(summary?.daily_average || 0, currency)}
              </Text>
              <Text style={styles.budgetFootText}>
                {t.home.daysLeft.replace('{n}', daysRemaining)}
              </Text>
            </View>
          </View>
        )}

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsScroll}
          contentContainerStyle={styles.quickActionsContent}
        >
          <QuickAction
            primary
            colors={colors}
            icon={<MaterialIcons name="add" size={16} color={colors.textInverse} />}
            label={t.home.quickAddExpense}
            onPress={() => openSheet('expense')}
          />
          <QuickAction
            colors={colors}
            icon={<MaterialIcons name="trending-up" size={16} color={colors.success} />}
            label={t.home.quickIncome}
            onPress={() => openSheet('income')}
          />
        </ScrollView>

        {/* ── Section header ───────────────────────────────────────────── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{t.home.sectionRecent}</Text>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation?.navigate?.('History')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>{t.home.viewAll}</Text>
            <MaterialIcons name="chevron-right" size={14} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Expense list wrapper card */}
        {expenses.length > 0 && <View style={styles.expenseListCard} />}
      </View>
    );
  };

  // show only first 5 in home
  const visibleExpenses = useMemo(() => expenses.slice(0, 5), [expenses]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { setError(null); loadData(); }}
        />
      )}

      <FlatList
        data={visibleExpenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={{
            marginHorizontal: spacing.lg,
            backgroundColor: colors.surface,
            // match the card border only at sides/bottom for items
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderBottomWidth: index === visibleExpenses.length - 1 ? 1 : 0,
            borderColor: colors.border,
            borderBottomLeftRadius: index === visibleExpenses.length - 1 ? borderRadius.lg : 0,
            borderBottomRightRadius: index === visibleExpenses.length - 1 ? borderRadius.lg : 0,
            paddingHorizontal: 8,
          }}>
            <ExpenseRow
              expense={item}
              colors={colors}
              currency={currency}
              t={t}
              lang={settings.language}
              onPress={setSelectedExpense}
              flash={item.id === flashId}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>{t.home.noExpenses}</Text>
              <Text style={styles.emptySubtext}>{t.home.noExpensesSubtext}</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB con breathing + rotate */}
      <View pointerEvents="box-none" style={styles.fabWrap}>
        {/* breathing ring */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fabRing,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: fabPulseScale }],
              opacity: fabPulseOpacity,
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => openSheet('expense')}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: fabRotateInterpolate }] }}>
              <MaterialIcons name="add" size={28} color={colors.textInverse} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Modals */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        initialType={sheetType}
        onSubmitExpense={handleAddExpense}
        onSubmitIncome={handleAddIncome}
      />

      <IncomesModal
        visible={incomesModalVisible}
        month={new Date().getMonth() + 1}
        year={new Date().getFullYear()}
        onClose={() => setIncomesModalVisible(false)}
        onUpdate={() => { incrementDataVersion(); loadData(); }}
      />

      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDelete={handleDeleteExpense}
      />
    </SafeAreaView>
  );
}
