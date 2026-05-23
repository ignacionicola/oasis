import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, borderRadius, fonts } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';
import api from '../services/api';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const COLORS = ['#1D9E75', '#4B9FE1', '#D4A843', '#E05555', '#9B59B6', '#E67E22'];

function formatDateLabel(d, lang) {
  const months = lang === 'en'
    ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    : ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SavingsGoalModal({ visible, onClose, goal }) {
  const colors = useTheme();
  const { settings, incrementDataVersion } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const isDark = settings.theme === 'dark';
  const insets = useSafeAreaInsets();

  const isEdit = !!goal;

  const [name, setName] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });
  const [color, setColor] = useState(COLORS[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(goal?.name || '');
      setRawAmount(goal ? String(Math.round(goal.target_amount)) : '');
      if (goal?.target_date) {
        setTargetDate(new Date(goal.target_date + 'T00:00:00'));
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        setTargetDate(d);
      }
      setColor(goal?.color || COLORS[0]);
      setShowPicker(false);
      setLoading(false);
    }
  }, [visible, goal]);

  const formatAmount = (digits) => (digits ? Number(digits).toLocaleString('es-AR') : '');

  const handleSave = async () => {
    const parsed = parseInt(rawAmount, 10);
    if (!name.trim()) {
      Alert.alert('', t.savings.goalName);
      return;
    }
    if (!rawAmount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('', t.savings.invalidAmount);
      return;
    }

    const data = {
      name: name.trim(),
      target_amount: parsed,
      target_date: targetDate.toISOString().split('T')[0],
      color,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.updateSavingsGoal(goal.id, data);
      } else {
        await api.createSavingsGoal(data);
      }
      incrementDataVersion();
      onClose();
    } catch (error) {
      Alert.alert('Error', error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selected) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setTargetDate(selected);
  };

  const styles = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(10, 22, 40, 0.55)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      height: Math.round(SCREEN_HEIGHT * 0.85),
      borderTopWidth: 1, borderColor: colors.border,
    },
    handle: {
      width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2,
      alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary,
      textAlign: 'center', marginBottom: spacing.md, letterSpacing: -0.4,
    },
    scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
    fieldLabel: {
      fontSize: 12, fontWeight: '600', color: colors.textTertiary,
      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.sm,
    },
    textInput: {
      backgroundColor: colors.background, borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      fontSize: 16, color: colors.textPrimary,
      borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
    },
    amountRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background, borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border,
      marginBottom: spacing.lg, gap: 6,
    },
    currencySign: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.textTertiary },
    amountInput: {
      flex: 1, fontFamily: fonts.displayMedium, fontSize: 22,
      color: colors.textPrimary, paddingVertical: spacing.md,
    },
    dateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.background, borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.md,
      borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg,
    },
    dateText: { fontSize: 16, color: colors.textPrimary },
    colorRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    colorCircle: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: 'center', justifyContent: 'center',
    },
    submitDock: {
      paddingHorizontal: spacing.md, paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
      borderTopWidth: 1, borderTopColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    submitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingVertical: spacing.md,
      borderRadius: borderRadius.md, backgroundColor: colors.primary,
    },
    submitBtnText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  }), [colors, insets.bottom]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>
              {isEdit ? t.savings.editTitle : t.savings.newTitle}
            </Text>

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={0}
            >
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Nombre */}
                <Text style={styles.fieldLabel}>{t.savings.goalName}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.savings.goalNamePlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  maxLength={100}
                  returnKeyType="done"
                />

                {/* Monto objetivo */}
                <Text style={styles.fieldLabel}>{t.savings.targetAmount}</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.currencySign}>{currency.symbol}</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={formatAmount(rawAmount)}
                    onChangeText={(text) => setRawAmount(text.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={15}
                  />
                </View>

                {/* Fecha objetivo */}
                <Text style={styles.fieldLabel}>{t.savings.targetDate}</Text>
                <TouchableOpacity
                  style={styles.dateBtn}
                  onPress={() => setShowPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dateText}>
                    {formatDateLabel(targetDate, settings.language)}
                  </Text>
                  <MaterialIcons name="calendar-today" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                {showPicker && (
                  <DateTimePicker
                    value={targetDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    onChange={onDateChange}
                    themeVariant={isDark ? 'dark' : 'light'}
                  />
                )}

                {/* Color */}
                <Text style={styles.fieldLabel}>{t.savings.color}</Text>
                <View style={styles.colorRow}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.textPrimary },
                      ]}
                      onPress={() => setColor(c)}
                      activeOpacity={0.8}
                    >
                      {color === c && <MaterialIcons name="check" size={20} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.submitDock}>
                <TouchableOpacity
                  style={[styles.submitBtn, { opacity: loading ? 0.7 : 1 }]}
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color={colors.textInverse} />
                      <Text style={styles.submitBtnText}>{t.savings.save}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
