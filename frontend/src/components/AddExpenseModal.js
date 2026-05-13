import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { spacing, borderRadius } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';
import api from '../services/api';

function formatWithDots(digits) {
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('es-AR', { maximumFractionDigits: 0 });
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
  const colors = useTheme();
  const { settings } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const processScanResult = async (uri) => {
    setScanning(true);
    try {
      const result = await api.scanTicket(uri);
      if (result.amount > 0) {
        setRawAmount(String(Math.round(result.amount)));
      }
      if (result.description !== '') {
        setDescription(result.description);
      }
      if (result.confidence < 0.6) {
        Alert.alert('', t.addExpense.lowConfidence);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleScanTicket = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para escanear el comprobante.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;
    await processScanResult(result.assets[0].uri);
  };

  const handleOpenCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para sacar la foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled) return;
    await processScanResult(result.assets[0].uri);
  };

  const handleAmountChange = (text) => {
    setRawAmount(text.replace(/\D/g, ''));
  };

  const handleSubmit = async () => {
    if (!rawAmount || !description) {
      Alert.alert(t.addExpense.requiredFields, t.addExpense.requiredFieldsMsg);
      return;
    }

    const parsedAmount = parseInt(rawAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t.addExpense.invalidAmount, t.addExpense.invalidAmountMsg);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parsedAmount,
        description: description.trim(),
        category: selectedCategory,
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
    setRawAmount('');
    setDescription('');
    setSelectedCategory(null);
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
    headerActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    scanButton: {
      alignItems: 'center',
      gap: 2,
    },
    scanButtonLabel: {
      fontSize: 11,
      color: colors.textTertiary,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
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
  }), [colors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.scanButton} onPress={handleOpenCamera}>
                {scanning ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="photo-camera" size={24} color={colors.primary} />
                )}
                <Text style={styles.scanButtonLabel}>{t.addExpense.openCamera}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scanButton} onPress={handleScanTicket}>
                {scanning ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="document-scanner" size={24} color={colors.primary} />
                )}
                <Text style={styles.scanButtonLabel}>{t.addExpense.scanTicket}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{t.addExpense.title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
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
              <Text style={styles.fieldLabel}>{t.addExpense.placeholder}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.addExpense.example}
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                maxLength={200}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {t.addExpense.category}{' '}
                <Text style={styles.optionalLabel}>
                  {selectedCategory ? '' : t.addExpense.autoDetect}
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
                <Text style={styles.submitText}>{t.addExpense.save}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
