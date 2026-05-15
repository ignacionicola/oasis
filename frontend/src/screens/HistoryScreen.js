import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
  StyleSheet, RefreshControl, TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import CategoryIcon from '../components/CategoryIcon';
import ExpenseDetailModal from '../components/ExpenseDetailModal';
import ErrorBanner from '../components/ErrorBanner';
import SwipeableScreen from '../components/SwipeableScreen';

const CATEGORIES = [
  'Comida', 'Transporte', 'Salud', 'Hogar',
  'Servicios', 'Entretenimiento', 'Ropa', 'Educación', 'Otros',
];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  const days = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];
  const today = new Date();
  const yest = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const isToday = d.toDateString() === today.toDateString();
  const isYest = d.toDateString() === yest.toDateString();
  if (isToday) return `HOY · ${d.getDate()} ${months[d.getMonth()]}`;
  if (isYest) return `AYER · ${d.getDate()} ${months[d.getMonth()]}`;
  return `${d.getDate()} ${months[d.getMonth()]} · ${days[d.getDay()]}`;
}

function HistoryRow({ expense, colors, currency, onPress }) {
  const catColor = colors.categories[expense.category] || colors.textTertiary;
  return (
    <TouchableOpacity
      onPress={() => onPress?.(expense)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}
    >
      <CategoryIcon category={expense.category} color={catColor} size={22} containerSize={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4,
        }}>
          {expense.description}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 8, paddingVertical: 3,
            backgroundColor: catColor + '18', borderRadius: 999,
          }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: catColor }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>
              {expense.category}
            </Text>
          </View>
          <Text style={{ fontSize: 11.5, color: colors.textQuaternary }}>
            {formatDate(expense.date)}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.3 }}>
        -{formatCurrency(expense.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen({ navigation }) {
  const colors = useTheme();
  const { settings, dataVersion } = useSettings();
  const { currency } = settings;
  const isDark = settings.theme === 'dark';
  const t = useTranslation();

  const now = new Date();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [total, setTotal] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getExpenses({
      month: selectedMonth,
      year: selectedYear,
      category: selectedCategory || undefined,
      search: debouncedSearch || undefined,
      limit: 200,
    }).then(data => {
      if (!cancelled) {
        setExpenses(data);
        setTotal(data.reduce((s, e) => s + e.amount, 0));
        setLoading(false);
      }
    }).catch(err => {
      if (!cancelled) {
        setError(err.message);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear, selectedCategory, debouncedSearch, dataVersion]);

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };
  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.getExpenses({
        month: selectedMonth, year: selectedYear,
        category: selectedCategory || undefined,
        search: debouncedSearch || undefined, limit: 200,
      });
      setExpenses(data);
      setTotal(data.reduce((s, e) => s + e.amount, 0));
      setError(null);
    } catch (err) { setError(err.message); }
    finally { setRefreshing(false); }
  };

  const handleDelete = async (expense) => {
    try {
      await api.deleteExpense(expense.id);
      setSelectedExpense(null);
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== expense.id);
        setTotal(updated.reduce((s, e) => s + e.amount, 0));
        return updated;
      });
    } catch (err) { Alert.alert('Error', err.message); }
  };

  // group by day
  const sections = useMemo(() => {
    const map = new Map();
    expenses.forEach(e => {
      const key = e.date;
      if (!map.has(key)) map.set(key, { title: key, total: 0, data: [] });
      const g = map.get(key);
      g.data.push(e);
      g.total += e.amount;
    });
    return Array.from(map.values()).sort((a, b) => b.title.localeCompare(a.title));
  }, [expenses]);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 26, fontWeight: '700',
      color: colors.textPrimary, letterSpacing: -0.6,
    },
    monthPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 6,
      paddingVertical: 4,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthBtn: {
      width: 26, height: 26,
      borderRadius: 13,
      alignItems: 'center', justifyContent: 'center',
    },
    monthLabel: {
      fontSize: 13, fontWeight: '600',
      color: colors.textPrimary,
      minWidth: 90, textAlign: 'center',
      textTransform: 'capitalize',
    },
    // hero summary
    summaryCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      backgroundColor: isDark ? '#0F1E34' : colors.surface,
      borderRadius: 22,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.12,
      textTransform: 'uppercase',
      color: colors.textTertiary,
      marginBottom: 6,
    },
    summaryAmountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    summaryCurrency: {
      fontSize: 20, fontWeight: '400',
      color: colors.textTertiary,
    },
    summaryAmount: {
      fontSize: 32, fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -1,
    },
    summaryCount: {
      fontSize: 13,
      color: colors.textTertiary,
      marginTop: 4,
    },
    // search
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
      height: 42,
    },
    searchInput: {
      flex: 1, fontSize: 14, color: colors.textPrimary,
      paddingVertical: 0,
    },
    // chips
    chipsScroll: {
      marginTop: spacing.md,
    },
    chipsContent: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      flexDirection: 'row',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipDot: { width: 6, height: 6, borderRadius: 3 },
    chipText: {
      fontSize: 12, fontWeight: '600',
      color: colors.textSecondary,
    },
    // day group
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    dayHeaderLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.14,
    },
    dayHeaderTotal: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      letterSpacing: -0.2,
    },
    dayGroupCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    // list
    listCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18, fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    sectionMeta: {
      fontSize: 12, color: colors.textTertiary,
    },
    // empty
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: 17, fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13.5, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 20,
    },
    emptyButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.full,
    },
    emptyButtonText: {
      fontSize: 13, fontWeight: '600',
      color: colors.primary,
    },
  }), [colors, isDark]);

  return (
    <SwipeableScreen navigation={navigation} currentIndex={2} totalTabs={4}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => setDebouncedSearch(prev => prev + '')}
          />
        )}

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderLabel}>{formatDayHeader(section.title)}</Text>
              <Text style={styles.dayHeaderTotal}>
                {formatCurrency(section.total, currency)}
              </Text>
            </View>
          )}
          renderSectionFooter={() => <View style={{ height: 4 }} />}
          renderItem={({ item, index, section }) => {
            const last = index === section.data.length - 1;
            const first = index === 0;
            return (
              <View style={{
                marginHorizontal: spacing.lg,
                backgroundColor: colors.surface,
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderTopWidth: first ? 1 : 0,
                borderBottomWidth: last ? 1 : 0,
                borderColor: colors.border,
                borderTopLeftRadius: first ? borderRadius.lg : 0,
                borderTopRightRadius: first ? borderRadius.lg : 0,
                borderBottomLeftRadius: last ? borderRadius.lg : 0,
                borderBottomRightRadius: last ? borderRadius.lg : 0,
              }}>
                <HistoryRow
                  expense={item}
                  colors={colors}
                  currency={currency}
                  onPress={setSelectedExpense}
                />
              </View>
            );
          }}
          ListHeaderComponent={
            <>
              {/* header */}
              <View style={styles.headerRow}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{t.history.title}</Text>
                  <View style={styles.monthPill}>
                    <TouchableOpacity onPress={prevMonth} style={styles.monthBtn} hitSlop={6}>
                      <MaterialIcons name="chevron-left" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.monthLabel}>
                      {t.months[selectedMonth]} {selectedYear}
                    </Text>
                    <TouchableOpacity
                      onPress={nextMonth}
                      style={styles.monthBtn}
                      hitSlop={6}
                      disabled={isCurrentMonth}
                    >
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={isCurrentMonth ? colors.textQuaternary : colors.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* summary card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total gastado</Text>
                <View style={styles.summaryAmountRow}>
                  <Text style={styles.summaryCurrency}>{currency.symbol}</Text>
                  <Text style={styles.summaryAmount}>
                    {total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <Text style={styles.summaryCount}>
                  {expenses.length} {expenses.length === 1 ? 'movimiento' : 'movimientos'}
                  {selectedCategory ? ` · ${selectedCategory}` : ''}
                </Text>
              </View>

              {/* search */}
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <MaterialIcons name="search" size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t.history.search}
                    placeholderTextColor={colors.textTertiary}
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                      <MaterialIcons name="close" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* category chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContent}
              >
                <TouchableOpacity
                  style={[
                    styles.chip,
                    !selectedCategory && {
                      backgroundColor: colors.primary + '18',
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setSelectedCategory(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    !selectedCategory && { color: colors.primary },
                  ]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {CATEGORIES.map(cat => {
                  const isSel = selectedCategory === cat;
                  const cc = colors.categories[cat] || colors.textTertiary;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.chip,
                        isSel && { backgroundColor: cc + '18', borderColor: cc },
                      ]}
                      onPress={() => setSelectedCategory(isSel ? null : cat)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.chipDot, { backgroundColor: cc }]} />
                      <Text style={[
                        styles.chipText,
                        isSel && { color: cc },
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {expenses.length > 0 && (
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>Movimientos</Text>
                  <Text style={styles.sectionMeta}>
                    {formatCurrency(total, currency)}
                  </Text>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            !loading && (
              (searchText || selectedCategory) ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="search-off" size={56} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>{t.history.noResults}</Text>
                  <Text style={styles.emptySubtitle}>{t.history.noResultsSubtitle}</Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => { setSearchText(''); setSelectedCategory(null); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyButtonText}>{t.history.clearFilters}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="receipt-long" size={56} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>
                    {t.history.noExpensesIn} {t.months[selectedMonth]}
                  </Text>
                  <Text style={styles.emptySubtitle}>{t.history.noExpensesSubtitle}</Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={prevMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emptyButtonText}>{t.history.viewPreviousMonth}</Text>
                  </TouchableOpacity>
                </View>
              )
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
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        />

        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onDelete={handleDelete}
        />
      </SafeAreaView>
    </SwipeableScreen>
  );
}
