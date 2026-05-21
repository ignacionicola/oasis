import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows, fonts } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import CategoryIcon from '../components/CategoryIcon';
import RecurringExpenseModal from '../components/RecurringExpenseModal';
import ErrorBanner from '../components/ErrorBanner';

export default function RecurringScreen({ navigation }) {
  const colors = useTheme();
  const { settings, dataVersion, incrementDataVersion } = useSettings();
  const { currency } = settings;
  const isDark = settings.theme === 'dark';
  const t = useTranslation();
  useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getRecurringExpenses();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, dataVersion]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setModalVisible(true);
  };

  const handleToggle = async (item) => {
    // Optimistic toggle
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
    );
    try {
      await api.toggleRecurringExpense(item.id);
      incrementDataVersion();
    } catch (err) {
      // revert
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: item.active } : i))
      );
      Alert.alert('Error', err?.message || String(err));
    }
  };

  const handleLongPress = (item) => {
    Alert.alert(
      t.recurring.deleteConfirm,
      item.description,
      [
        { text: t.recurring.cancel, style: 'cancel' },
        {
          text: t.recurring.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteRecurringExpense(item.id);
              incrementDataVersion();
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            } catch (err) {
              Alert.alert('Error', err?.message || String(err));
            }
          },
        },
      ],
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    backBtn: {
      width: 38, height: 38,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: fonts.displayBold,
      fontSize: 22,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textTertiary,
      marginTop: 2,
    },
    newBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary + '18',
      borderWidth: 1,
      borderColor: colors.primary + '50',
    },
    newBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: 12.5,
      color: colors.primary,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: spacing.sm,
    },
    cardInfo: { flex: 1, minWidth: 0, gap: 3 },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardDesc: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    cardAmount: {
      fontFamily: fonts.monoSemi,
      fontSize: 15,
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    cardDay: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    inactive: { opacity: 0.5 },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13.5,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
  }), [colors]);

  const renderItem = ({ item }) => {
    const catColor = colors.categories[item.category] || colors.textTertiary;
    return (
      <TouchableOpacity
        style={[styles.card, !item.active && styles.inactive]}
        onPress={() => openEdit(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <CategoryIcon category={item.category} color={catColor} size={22} containerSize={44} />
        <View style={styles.cardInfo}>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.cardAmount}>{formatCurrency(item.amount, currency)}</Text>
          </View>
          <Text style={styles.cardDay}>
            {t.recurring.dayOfMonth.replace('{n}', item.day_of_month)}
          </Text>
        </View>
        <Switch
          value={item.active}
          onValueChange={() => handleToggle(item)}
          trackColor={{ false: colors.border, true: colors.primary + '60' }}
          thumbColor={item.active ? colors.primary : colors.textTertiary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {error && (
        <ErrorBanner message={error} onRetry={() => { setError(null); loadData(); }} />
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack?.()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t.recurring.title}</Text>
            <Text style={styles.subtitle}>{t.recurring.subtitle}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openCreate} activeOpacity={0.8}>
          <MaterialIcons name="add" size={15} color={colors.primary} />
          <Text style={styles.newBtnText}>{t.recurring.newRecurring.replace('+ ', '')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="autorenew" size={56} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>{t.recurring.empty}</Text>
              <Text style={styles.emptySub}>{t.recurring.emptySub}</Text>
            </View>
          }
        />
      )}

      <RecurringExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        expense={editing}
      />
    </SafeAreaView>
  );
}
