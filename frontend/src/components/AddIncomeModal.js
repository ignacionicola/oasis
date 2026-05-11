import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';

function formatWithDots(digits) {
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

export default function AddIncomeModal({ visible, onClose, onSubmit }) {
  const colors = useTheme();
  const { settings } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (text) => {
    setRawAmount(text.replace(/\D/g, ''));
  };

  const handleSubmit = async () => {
    if (!rawAmount) {
      Alert.alert('Campo requerido', 'Ingresá el monto.');
      return;
    }
    const parsedAmount = parseInt(rawAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'Ingresá un monto válido.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        description: description.trim() || null,
        date: new Date().toISOString().split('T')[0],
      });
      setRawAmount('');
      setDescription('');
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(10, 22, 40, 0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    currencySign: {
      fontSize: 32,
      fontWeight: '300',
      color: colors.textTertiary,
    },
    amountInput: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 120,
      textAlign: 'center',
      letterSpacing: -2,
    },
    field: {
      marginBottom: spacing.lg,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      letterSpacing: 0.3,
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
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      marginTop: spacing.sm,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
  }), [colors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{t.addIncome.title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.currencySign}>{currency.symbol}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              value={formatWithDots(rawAmount)}
              onChangeText={handleAmountChange}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t.addIncome.placeholder}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t.addIncome.example}
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              maxLength={200}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <MaterialIcons name="check" size={20} color={colors.textInverse} />
                <Text style={styles.submitText}>{t.addIncome.save}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
