import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius, fonts, shadows } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';

export default function SavingsGoalDetailModal({ visible, goal, onClose, onEdit }) {
  const colors = useTheme();
  const { settings, incrementDataVersion } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const isDark = settings.theme === 'dark';

  const [actionMode, setActionMode] = useState(null); // 'add' | 'withdraw' | null
  const [rawAmount, setRawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    closeBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    content: { padding: spacing.lg, gap: spacing.lg },
    titleCard: {
      borderRadius: 24, padding: spacing.lg, overflow: 'hidden',
      ...shadows.md,
    },
    goalName: {
      fontFamily: fonts.displayBold, fontSize: 24, color: '#fff',
      letterSpacing: -0.5, marginBottom: 4,
    },
    goalMeta: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    bigAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: spacing.md },
    bigCurrent: { fontFamily: fonts.displayBold, fontSize: 34, color: '#fff', letterSpacing: -1 },
    bigTarget: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
    progressTrack: {
      height: 10, borderRadius: 5, marginTop: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#fff' },
    progressPct: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 6, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    statCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg,
      padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: 4,
    },
    statLabel: {
      fontSize: 10.5, fontWeight: '700', color: colors.textTertiary,
      letterSpacing: 0.12, textTransform: 'uppercase',
    },
    statValue: {
      fontFamily: fonts.display, fontSize: 17, color: colors.textPrimary, letterSpacing: -0.3,
    },
    actionsRow: { flexDirection: 'row', gap: spacing.sm },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 15, borderRadius: borderRadius.md,
    },
    actionBtnText: { fontSize: 15, fontWeight: '700' },
    secondaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
    secondaryBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 13, borderRadius: borderRadius.md,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    secondaryText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.25)', marginTop: spacing.sm,
    },
    badgeText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },
    // amount input overlay
    inputOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 22, 40, 0.6)',
      alignItems: 'center', justifyContent: 'center',
      padding: spacing.lg,
    },
    inputCard: {
      width: '100%', backgroundColor: colors.surface, borderRadius: 24,
      padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md,
      ...shadows.md,
    },
    inputTitle: {
      fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary, textAlign: 'center',
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.background, borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border,
    },
    inputSign: { fontFamily: fonts.displayMedium, fontSize: 22, color: colors.textTertiary },
    amountInput: {
      flex: 1, fontFamily: fonts.displayMedium, fontSize: 26,
      color: colors.textPrimary, paddingVertical: spacing.md, textAlign: 'center',
    },
    inputBtns: { flexDirection: 'row', gap: spacing.sm },
    cancelBtn: {
      flex: 1, paddingVertical: 13, borderRadius: borderRadius.md,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    confirmBtn: {
      flex: 1, paddingVertical: 13, borderRadius: borderRadius.md, alignItems: 'center',
    },
  }), [colors]);

  if (!goal) return null;

  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    : 0;
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);

  const openAction = (mode) => {
    setActionMode(mode);
    setRawAmount('');
  };

  const formatAmount = (digits) => (digits ? Number(digits).toLocaleString('es-AR') : '');

  const confirmAction = async () => {
    const parsed = parseInt(rawAmount, 10);
    if (!rawAmount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('', t.savings.invalidAmount);
      return;
    }
    setLoading(true);
    try {
      if (actionMode === 'add') {
        await api.contributeToGoal(goal.id, parsed);
      } else {
        await api.withdrawFromGoal(goal.id, parsed);
      }
      incrementDataVersion();
      setActionMode(null);
      onClose();
    } catch (error) {
      Alert.alert('Error', error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t.savings.deleteConfirm,
      goal.name,
      [
        { text: t.savings.cancel, style: 'cancel' },
        {
          text: t.savings.delete,
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t.savings.deleteConfirm,
              t.savings.deleteFinal,
              [
                { text: t.savings.cancel, style: 'cancel' },
                {
                  text: t.savings.delete,
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.deleteSavingsGoal(goal.id);
                      incrementDataVersion();
                      onClose();
                    } catch (error) {
                      Alert.alert('Error', error?.message || String(error));
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const monthsText = t.savings.monthsRemaining.replace('{months}', goal.months_remaining);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialIcons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title card con color de la meta */}
          <View style={[styles.titleCard, { backgroundColor: goal.color }]}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalMeta}>{monthsText}</Text>
            <View style={styles.bigAmountRow}>
              <Text style={styles.bigCurrent}>{formatCurrency(goal.current_amount, currency)}</Text>
              <Text style={styles.bigTarget}>/ {formatCurrency(goal.target_amount, currency)}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.progressPct}>{pct}%</Text>
            {goal.completed && (
              <View style={styles.badge}>
                <MaterialIcons name="check-circle" size={14} color="#fff" />
                <Text style={styles.badgeText}>{t.savings.completed}</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t.savings.saved}</Text>
              <Text style={styles.statValue}>{formatCurrency(goal.current_amount, currency)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t.savings.remaining}</Text>
              <Text style={styles.statValue}>{formatCurrency(remaining, currency)}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t.savings.monthsLabel}</Text>
              <Text style={styles.statValue}>{goal.months_remaining}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>{t.savings.perMonthLabel}</Text>
              <Text style={styles.statValue}>{formatCurrency(goal.monthly_required, currency)}</Text>
            </View>
          </View>

          {/* Sumar / Retirar */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => openAction('add')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>{t.savings.addAmount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.danger }]}
              onPress={() => openAction('withdraw')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="remove" size={20} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>{t.savings.withdraw}</Text>
            </TouchableOpacity>
          </View>

          {/* Editar / Eliminar */}
          <View style={styles.secondaryRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => onEdit?.(goal)} activeOpacity={0.7}>
              <MaterialIcons name="edit" size={18} color={colors.textPrimary} />
              <Text style={styles.secondaryText}>{t.savings.edit}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDelete} activeOpacity={0.7}>
              <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
              <Text style={[styles.secondaryText, { color: colors.danger }]}>{t.savings.delete}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Overlay de input para sumar/retirar */}
        {actionMode && (
          <View style={styles.inputOverlay}>
            <View style={styles.inputCard}>
              <Text style={styles.inputTitle}>
                {actionMode === 'add' ? t.savings.amountToAdd : t.savings.amountToWithdraw}
              </Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputSign}>{currency.symbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  value={formatAmount(rawAmount)}
                  onChangeText={(text) => setRawAmount(text.replace(/\D/g, ''))}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  maxLength={15}
                />
              </View>
              <View style={styles.inputBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setActionMode(null)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryText}>{t.savings.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: actionMode === 'add' ? colors.success : colors.danger, opacity: loading ? 0.7 : 1 },
                  ]}
                  onPress={confirmAction}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                      {actionMode === 'add' ? t.savings.add : t.savings.withdraw.replace('- ', '')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
