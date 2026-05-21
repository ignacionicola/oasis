import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, fonts } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';
import CategoryIcon from './CategoryIcon';
import api from '../services/api';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const CATEGORIES = [
  'Comida', 'Transporte', 'Salud', 'Hogar', 'Servicios',
  'Entretenimiento', 'Ropa', 'Educación', 'Otros',
];

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function RecurringExpenseModal({ visible, onClose, expense }) {
  const colors = useTheme();
  const { settings, incrementDataVersion } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const isDark = settings.theme === 'dark';
  const insets = useSafeAreaInsets();

  const isEdit = !!expense;

  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Otros');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setRawAmount(expense ? String(Math.round(expense.amount)) : '');
      setDescription(expense?.description || '');
      setCategory(expense?.category || 'Otros');
      setDayOfMonth(expense?.day_of_month || 1);
      setLoading(false);
    }
  }, [visible, expense]);

  const formatAmount = (digits) => {
    if (!digits) return '';
    return Number(digits).toLocaleString('es-AR');
  };

  const handleSave = async () => {
    const parsed = parseInt(rawAmount, 10);
    if (!rawAmount || isNaN(parsed) || parsed <= 0) {
      Alert.alert(t.addExpense.invalidAmount, t.addExpense.invalidAmountMsg);
      return;
    }
    if (!description.trim()) {
      Alert.alert(t.addExpense.requiredFields, t.addExpense.requiredFieldsMsg);
      return;
    }

    const data = {
      description: description.trim(),
      amount: parsed,
      category,
      day_of_month: dayOfMonth,
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.updateRecurringExpense(expense.id, data);
      } else {
        await api.createRecurringExpense(data);
      }
      incrementDataVersion();
      onClose();
    } catch (error) {
      Alert.alert('Error', error?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(10, 22, 40, 0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      height: Math.round(SCREEN_HEIGHT * 0.85),
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    handle: {
      width: 40, height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
      letterSpacing: -0.4,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    amountDisplay: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    amountLabel: {
      fontSize: 12, fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 6,
      color: colors.danger,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: 6,
    },
    currencySign: {
      fontFamily: fonts.displayMedium,
      fontSize: 28,
      color: colors.textTertiary,
    },
    amountInput: {
      fontFamily: fonts.displayBold,
      fontSize: 56,
      letterSpacing: -2,
      lineHeight: 64,
      padding: 0,
      minWidth: 80,
      textAlign: 'center',
    },
    fieldLabel: {
      fontSize: 12, fontWeight: '600',
      color: colors.textTertiary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
    },
    textInput: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    categoryChip: {
      width: '22%',
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      gap: 4,
    },
    categoryChipLabel: {
      fontSize: 10, fontWeight: '600',
      textAlign: 'center',
    },
    dayScroll: {
      marginBottom: spacing.md,
    },
    dayChip: {
      width: 46, height: 46,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      marginRight: spacing.sm,
    },
    dayChipText: {
      fontFamily: fonts.displayMedium,
      fontSize: 16,
    },
    submitDock: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
    },
    submitBtnText: {
      fontSize: 16, fontWeight: '600',
      color: colors.textInverse,
    },
  }), [colors, insets.bottom]);

  const amountColor = rawAmount ? colors.textPrimary : colors.textTertiary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>
              {isEdit ? t.recurring.editTitle : t.recurring.newTitle}
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
                {/* Monto */}
                <View style={styles.amountDisplay}>
                  <Text style={styles.amountLabel}>{t.recurring.amountLabel}</Text>
                  <View style={styles.amountRow}>
                    <Text style={styles.currencySign}>{currency.symbol}</Text>
                    <TextInput
                      style={[styles.amountInput, { color: amountColor }]}
                      value={formatAmount(rawAmount)}
                      onChangeText={(text) => setRawAmount(text.replace(/\D/g, ''))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      maxLength={15}
                    />
                  </View>
                </View>

                {/* Descripción */}
                <Text style={styles.fieldLabel}>{t.recurring.descriptionLabel}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t.recurring.descriptionPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                  returnKeyType="done"
                />

                {/* Categoría */}
                <Text style={styles.fieldLabel}>{t.recurring.categoryLabel}</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    const catColor = colors.categories[cat] || colors.textTertiary;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected ? catColor + '18' : colors.background,
                            borderColor: isSelected ? catColor : colors.border,
                          },
                        ]}
                        onPress={() => setCategory(cat)}
                        activeOpacity={0.7}
                      >
                        <CategoryIcon
                          category={cat}
                          color={catColor}
                          size={18}
                          containerSize={34}
                          style={{ backgroundColor: isSelected ? catColor + '25' : catColor + '14' }}
                        />
                        <Text style={[
                          styles.categoryChipLabel,
                          { color: isSelected ? catColor : colors.textSecondary },
                        ]}>
                          {t.categories?.[cat] || cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Día del mes */}
                <Text style={styles.fieldLabel}>{t.recurring.dayLabel}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dayScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {DAYS.map((d) => {
                    const isSelected = dayOfMonth === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: isSelected ? colors.primary + '18' : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setDayOfMonth(d)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.dayChipText,
                          { color: isSelected ? colors.primary : colors.textSecondary },
                        ]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </ScrollView>

              {/* Botón guardar fijo abajo */}
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
                      <Text style={styles.submitBtnText}>{t.recurring.save}</Text>
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
