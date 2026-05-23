import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
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
import SavingsGoalModal from '../components/SavingsGoalModal';
import SavingsGoalDetailModal from '../components/SavingsGoalDetailModal';
import ErrorBanner from '../components/ErrorBanner';

export default function SavingsScreen({ navigation }) {
  const colors = useTheme();
  const { settings, dataVersion } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailGoal, setDetailGoal] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getSavingsGoals();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, dataVersion]);

  // Mantener el detalle abierto sincronizado con datos frescos
  useEffect(() => {
    if (detailGoal) {
      const fresh = items.find((g) => g.id === detailGoal.id);
      if (fresh && fresh !== detailGoal) setDetailGoal(fresh);
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditing(null);
    setEditModalVisible(true);
  };

  const openEditFromDetail = (goal) => {
    setDetailGoal(null);
    setEditing(goal);
    setEditModalVisible(true);
  };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
      paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    backBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    title: {
      fontFamily: fonts.displayBold, fontSize: 22, color: colors.textPrimary, letterSpacing: -0.5,
    },
    subtitle: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
    newBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: borderRadius.full,
      backgroundColor: colors.primary + '18', borderWidth: 1, borderColor: colors.primary + '50',
    },
    newBtnText: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.primary },
    listContent: {
      paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
      paddingBottom: spacing.xxl, flexGrow: 1,
    },
    card: {
      backgroundColor: colors.surface, borderRadius: borderRadius.lg,
      borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
      marginBottom: spacing.md, ...shadows.sm,
    },
    cardTopRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    },
    cardName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, flex: 1 },
    cardPct: { fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: -0.5 },
    progressTrack: {
      height: 8, borderRadius: 4, marginTop: 12,
      backgroundColor: colors.borderLight, overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 4 },
    cardAmounts: { fontSize: 13, color: colors.textSecondary, marginTop: 8 },
    cardFoot: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
    completedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: borderRadius.full, backgroundColor: colors.success + '20', marginTop: 8,
    },
    completedText: { fontSize: 11, fontWeight: '700', color: colors.success },
    emptyState: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: 16, fontWeight: '700', color: colors.textPrimary,
      marginTop: spacing.md, textAlign: 'center',
    },
    emptySub: { fontSize: 13.5, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 },
  }), [colors]);

  const renderItem = ({ item }) => {
    const pct = item.target_amount > 0
      ? Math.min(100, Math.round((item.current_amount / item.target_amount) * 100))
      : 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setDetailGoal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.cardPct, { color: item.color }]}>{pct}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: item.color }]} />
        </View>
        <Text style={styles.cardAmounts}>
          {formatCurrency(item.current_amount, currency)} {t.savings.remaining.toLowerCase()} {formatCurrency(item.target_amount, currency)}
        </Text>
        {item.completed ? (
          <View style={styles.completedBadge}>
            <MaterialIcons name="check-circle" size={13} color={colors.success} />
            <Text style={styles.completedText}>{t.savings.completed}</Text>
          </View>
        ) : (
          <Text style={styles.cardFoot}>
            {t.savings.monthsRemaining.replace('{months}', item.months_remaining)}
            {'  ·  '}
            {t.savings.monthlyRequired.replace('${amount}', formatCurrency(item.monthly_required, currency))}
          </Text>
        )}
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
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t.savings.title}</Text>
            <Text style={styles.subtitle}>{t.savings.subtitle}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={openCreate} activeOpacity={0.8}>
          <MaterialIcons name="add" size={15} color={colors.primary} />
          <Text style={styles.newBtnText}>{t.savings.newGoal.replace('+ ', '')}</Text>
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
              <MaterialIcons name="savings" size={56} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>{t.savings.empty}</Text>
              <Text style={styles.emptySub}>{t.savings.emptySub}</Text>
            </View>
          }
        />
      )}

      <SavingsGoalModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        goal={editing}
      />

      <SavingsGoalDetailModal
        visible={!!detailGoal}
        goal={detailGoal}
        onClose={() => setDetailGoal(null)}
        onEdit={openEditFromDetail}
      />
    </SafeAreaView>
  );
}
