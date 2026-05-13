import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { spacing, borderRadius, shadows } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import ExpenseCard from '../components/ExpenseCard';
import BudgetBar from '../components/BudgetBar';
import AddExpenseModal from '../components/AddExpenseModal';
import IncomesModal from '../components/IncomesModal';
import ExpenseDetailModal from '../components/ExpenseDetailModal';
import ErrorBanner from '../components/ErrorBanner';

export default function HomeScreen({ navigation }) {
  const colors = useTheme();
  const { settings, incrementDataVersion } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [incomesModalVisible, setIncomesModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  const runPicker = async (source) => {
    console.log('[SCAN] 1. runPicker iniciado, source:', source);
    Alert.alert('DEBUG 1', `runPicker source=${source}`);

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[SCAN] 2. Permiso cámara:', status);
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.');
        return null;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[SCAN] 2. Permiso galería:', status);
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.');
        return null;
      }
    }

    console.log('[SCAN] 3. Cerrando modal antes de abrir picker');
    setModalVisible(false);
    await new Promise(r => setTimeout(r, 300));

    let result;
    try {
      console.log('[SCAN] 4. Lanzando picker...');
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
      }
      console.log('[SCAN] 5. Picker volvió:', JSON.stringify(result).substring(0, 200));
    } catch (err) {
      console.log('[SCAN] ERROR picker:', err.message);
      Alert.alert('DEBUG ERROR PICKER', err.message);
      setModalVisible(true);
      return null;
    }

    console.log('[SCAN] 6. Reabriendo modal');
    setModalVisible(true);

    if (result.canceled) {
      console.log('[SCAN] 7. Usuario canceló');
      Alert.alert('DEBUG', 'Picker canceled');
      return null;
    }

    const uri = result.assets[0].uri;
    console.log('[SCAN] 8. URI obtenida:', uri);
    Alert.alert('DEBUG 8', `URI: ${uri.substring(0, 60)}...`);
    return uri;
  };

  const scanFromUri = async (uri) => {
    console.log('[SCAN] 9. Llamando api.scanTicket...');
    Alert.alert('DEBUG 9', 'Enviando imagen al backend...');
    setScanning(true);
    try {
      const scanned = await api.scanTicket(uri);
      console.log('[SCAN] 10. Respuesta del backend:', JSON.stringify(scanned));
      Alert.alert('DEBUG 10 OK', `Backend respondió: amount=${scanned.amount}, desc=${scanned.description}`);
      setPrefillData({
        amount: scanned.amount,
        description: scanned.description || '',
        confidence: scanned.confidence,
        _ts: Date.now(),
      });
    } catch (err) {
      console.log('[SCAN] ERROR backend:', err.message);
      Alert.alert('DEBUG ERROR BACKEND', err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleRequestScan = async () => {
    const uri = await runPicker('gallery');
    if (uri) await scanFromUri(uri);
  };

  const handleRequestCamera = async () => {
    const uri = await runPicker('camera');
    if (uri) await scanFromUri(uri);
  };

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const [summaryData, expenseData] = await Promise.all([
        api.getMonthSummary(now.getMonth() + 1, now.getFullYear()),
        api.getExpenses({ month: now.getMonth() + 1, year: now.getFullYear() }),
      ]);
      setSummary(summaryData);
      setExpenses(expenseData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  };

  const handleAddExpense = async (expenseData) => {
    const result = await api.createExpense(expenseData);

    if (result.duplicate_warning) {
      Alert.alert(
        'Posible duplicado',
        result.duplicate_warning.message,
        [{ text: 'Entendido' }]
      );
    }

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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    appName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: -0.5,
    },
    monthLabel: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 2,
    },
    heroCard: {
      margin: spacing.lg,
      backgroundColor: colors.surfaceElevated,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.md,
      shadowOpacity: 0.15,
      elevation: 6,
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textTertiary,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    heroAmount: {
      fontSize: 40,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -2,
      marginTop: spacing.xs,
    },
    addIncomeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    addIncomeText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    heroMeta: {
      flexDirection: 'row',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    heroStat: {
      flex: 1,
      alignItems: 'center',
    },
    heroStatValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    heroStatLabel: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
    },
    heroDivider: {
      width: 1,
      backgroundColor: colors.borderLight,
    },
    section: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    budgetCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      ...shadows.sm,
    },
    budgetDivider: {
      height: 1,
      backgroundColor: colors.borderLight,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    listCount: {
      fontSize: 14,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    listContent: {
      paddingBottom: 100,
    },
    separator: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginLeft: 82,
    },
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
    },
    fab: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.lg,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.md,
      elevation: 5,
    },
  }), [colors]);

  const renderHeader = () => (
    <View>
      <View style={styles.heroCard}>
        {summary?.total_income > 0 ? (
          <>
            <Text style={styles.heroLabel}>{t.home.availableThisMonth}</Text>
            <Text style={[
              styles.heroAmount,
              { color: summary.available >= 0 ? colors.primary : colors.danger },
            ]}>
              {formatCurrency(Math.abs(summary.available), currency)}
            </Text>
            <View style={styles.heroMeta}>
              <TouchableOpacity
                style={styles.heroStat}
                onPress={() => setIncomesModalVisible(true)}
                activeOpacity={0.6}
              >
                <Text style={styles.heroStatValue}>
                  {formatCurrency(summary.total_income, currency)}
                </Text>
                <Text style={[styles.heroStatLabel, { color: colors.primary }]}>
                  {t.home.income}
                </Text>
              </TouchableOpacity>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>
                  {formatCurrency(summary.total_spent, currency)}
                </Text>
                <Text style={styles.heroStatLabel}>{t.home.spent}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heroLabel}>{t.home.spentThisMonth}</Text>
            <Text style={styles.heroAmount}>
              {summary ? formatCurrency(summary.total_spent, currency) : '—'}
            </Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{summary?.expense_count || 0}</Text>
                <Text style={styles.heroStatLabel}>{t.home.expenses}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>
                  {summary ? formatCurrency(summary.daily_average, currency) : '—'}
                </Text>
                <Text style={styles.heroStatLabel}>{t.home.perDay}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{summary?.top_category || '—'}</Text>
                <Text style={styles.heroStatLabel}>{t.home.topCategory}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.addIncomeButton}
        onPress={() => setIncomesModalVisible(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add" size={15} color={colors.textSecondary} />
        <Text style={styles.addIncomeText}>{t.home.addIncome}</Text>
      </TouchableOpacity>

      {summary?.budget_status?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.home.monthlyBudgets}</Text>
          <View style={styles.budgetCard}>
            {summary.budget_status
              .filter(b => b.spent > 0)
              .sort((a, b) => b.percentage_used - a.percentage_used)
              .slice(0, 5)
              .map((budget, i) => (
                <View key={budget.category}>
                  {i > 0 && <View style={styles.budgetDivider} />}
                  <BudgetBar
                    category={budget.category}
                    spent={budget.spent}
                    limit={budget.monthly_limit}
                    alertLevel={budget.alert_level}
                  />
                </View>
              ))}
          </View>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>{t.home.latestExpenses}</Text>
        <Text style={styles.listCount}>{expenses.length}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => { setError(null); loadData(); }}
        />
      )}

      <View style={styles.topBar}>
        <View>
          <Text style={styles.appName}>{t.home.appName}</Text>
          <Text style={styles.monthLabel}>
            {summary?.month_number ? t.months[summary.month_number] : ''} {summary?.year || ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onPress={setSelectedExpense} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>

      <IncomesModal
        visible={incomesModalVisible}
        month={new Date().getMonth() + 1}
        year={new Date().getFullYear()}
        onClose={() => setIncomesModalVisible(false)}
        onUpdate={() => { incrementDataVersion(); loadData(); }}
      />

      <AddExpenseModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setPrefillData(null);
        }}
        onSubmit={handleAddExpense}
        onRequestScan={handleRequestScan}
        onRequestCamera={handleRequestCamera}
        scanning={scanning}
        prefillData={prefillData}
      />

      <ExpenseDetailModal
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDelete={handleDeleteExpense}
      />
    </SafeAreaView>
  );
}
