import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
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
import ExpenseCard from '../components/ExpenseCard';
import ExpenseDetailModal from '../components/ExpenseDetailModal';
import ErrorBanner from '../components/ErrorBanner';
import SwipeableScreen from '../components/SwipeableScreen';

const CATEGORIES = [
  { name: 'Comida', icon: 'restaurant' },
  { name: 'Transporte', icon: 'directions-car' },
  { name: 'Salud', icon: 'favorite' },
  { name: 'Hogar', icon: 'home' },
  { name: 'Servicios', icon: 'receipt' },
  { name: 'Entretenimiento', icon: 'movie' },
  { name: 'Ropa', icon: 'checkroom' },
  { name: 'Educación', icon: 'school' },
  { name: 'Otros', icon: 'more-horiz' },
];

export default function HistoryScreen({ navigation }) {
  const colors = useTheme();
  const { settings, dataVersion } = useSettings();
  const { currency } = settings;
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
  const [categoryFilterVisible, setCategoryFilterVisible] = useState(false);
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
        setTotal(data.reduce((sum, e) => sum + e.amount, 0));
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
    const isCurrentMonth =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;
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
        month: selectedMonth,
        year: selectedYear,
        category: selectedCategory || undefined,
        search: debouncedSearch || undefined,
        limit: 200,
      });
      setExpenses(data);
      setTotal(data.reduce((sum, e) => sum + e.amount, 0));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteExpense = async (expense) => {
    try {
      await api.deleteExpense(expense.id);
      setSelectedExpense(null);
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== expense.id);
        setTotal(updated.reduce((sum, e) => sum + e.amount, 0));
        return updated;
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      gap: spacing.md,
    },
    monthText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      minWidth: 140,
      textAlign: 'center',
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: colors.textPrimary,
    },
    filterButton: {
      padding: spacing.sm,
    },
    chipsContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    chipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    totalsCount: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    totalsAmount: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    separator: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginLeft: 82,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: spacing.md,
    },
    emptyButton: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      backgroundColor: 'transparent',
    },
    emptyButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    tipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.lg,
    },
    tipText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    listContent: {
      paddingBottom: 32,
      flexGrow: 1,
    },
  }), [colors]);

  return (
    <SwipeableScreen navigation={navigation} currentIndex={2} totalTabs={4}>
    <SafeAreaView style={styles.container} edges={['top']}>
      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => setDebouncedSearch(prev => prev + '')}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{t.history.title}</Text>
        <Text style={styles.subtitle}>{t.history.subtitle}</Text>
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={prevMonth} hitSlop={12}>
          <MaterialIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {t.months[selectedMonth]} {selectedYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={12} disabled={isCurrentMonth}>
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={isCurrentMonth ? colors.textTertiary : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setCategoryFilterVisible(v => !v)}
          hitSlop={8}
        >
          <MaterialIcons
            name="filter-list"
            size={24}
            color={selectedCategory ? colors.primary : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {categoryFilterVisible && (
        <View style={styles.chipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.chip,
                !selectedCategory && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.chipText,
                !selectedCategory && { color: colors.primary, fontWeight: '600' },
              ]}>
                {t.history.all}
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              const catColor = colors.categories[cat.name];
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: catColor + '20', borderColor: catColor },
                  ]}
                  onPress={() => setSelectedCategory(isSelected ? null : cat.name)}
                >
                  <MaterialIcons
                    name={cat.icon}
                    size={14}
                    color={isSelected ? catColor : colors.textTertiary}
                  />
                  <Text style={[
                    styles.chipText,
                    isSelected && { color: catColor, fontWeight: '600' },
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.totalsRow}>
        <Text style={styles.totalsCount}>
          {expenses.length} {t.home.expenses}
        </Text>
        <Text style={styles.totalsAmount}>
          {formatCurrency(total, currency)}
        </Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onPress={setSelectedExpense} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading && (
            (searchText || selectedCategory) ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="search-off" size={72} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>{t.history.noResults}</Text>
                <Text style={styles.emptySubtitle}>{t.history.noResultsSubtitle}</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => {
                    setSearchText('');
                    setSelectedCategory(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyButtonText}>{t.history.clearFilters}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={72} color={colors.textTertiary} />
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
        ListFooterComponent={
          expenses.length > 0 && expenses.length < 5 ? (
            <View style={styles.tipContainer}>
              <MaterialIcons name="lightbulb-outline" size={16} color={colors.accent} />
              <Text style={styles.tipText}>{t.history.swipeTip}</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />

      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDelete={handleDeleteExpense}
      />
    </SafeAreaView>
    </SwipeableScreen>
  );
}
