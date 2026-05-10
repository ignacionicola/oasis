import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

function parseArgentineAmount(str) {
  const s = str.trim();
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    // Formato AR: 1.500,50 — el punto es separador de miles, la coma es decimal
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }

  if (hasComma && !hasDot) {
    const afterComma = s.split(',')[1] || '';
    // Si hay exactamente 3 dígitos tras la coma → separador de miles: 1,500 → 1500
    if (afterComma.length === 3) {
      return parseFloat(s.replace(',', ''));
    }
    // Sino → decimal europeo: 1500,50 → 1500.50
    return parseFloat(s.replace(',', '.'));
  }

  if (!hasComma && hasDot) {
    // Decimal estándar: 1500.50
    return parseFloat(s);
  }

  // Sin separadores: 1500
  return parseFloat(s);
}

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

export default function AddExpenseModal({ visible, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description) {
      Alert.alert('Campos requeridos', 'Ingresá el monto y una descripción.');
      return;
    }

    const parsedAmount = parseArgentineAmount(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'Ingresá un monto válido.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        description: description.trim(),
        category: selectedCategory, // null = auto-categorizar
        date: new Date().toISOString().split('T')[0],
        source: 'manual',
      });
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory(null);
  };

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
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nuevo gasto</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Monto */}
            <View style={styles.amountContainer}>
              <Text style={styles.currencySign}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            {/* Descripción */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>¿En qué gastaste?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Compras en el super"
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                maxLength={200}
              />
            </View>

            {/* Categoría (opcional) */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Categoría{' '}
                <Text style={styles.optionalLabel}>
                  {selectedCategory ? '' : '(se detecta automáticamente)'}
                </Text>
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  const catColor = colors.categories[cat.name];
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={[
                        styles.categoryChip,
                        isSelected && { backgroundColor: catColor + '20', borderColor: catColor },
                      ]}
                      onPress={() =>
                        setSelectedCategory(isSelected ? null : cat.name)
                      }
                    >
                      <MaterialIcons
                        name={cat.icon}
                        size={16}
                        color={isSelected ? catColor : colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color: catColor, fontWeight: '600' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Botón guardar */}
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
                <Text style={styles.submitText}>Guardar gasto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '90%',
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
  optionalLabel: {
    fontWeight: '400',
    color: colors.textTertiary,
    fontStyle: 'italic',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
