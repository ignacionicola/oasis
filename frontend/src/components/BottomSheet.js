import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, ActivityIndicator,
  Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { spacing, borderRadius, fonts } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';
import CategoryIcon from './CategoryIcon';
import api from '../services/api';

const CATEGORIES = [
  { name: 'Comida' },
  { name: 'Transporte' },
  { name: 'Salud' },
  { name: 'Hogar' },
  { name: 'Servicios' },
  { name: 'Entretenimiento' },
  { name: 'Ropa' },
  { name: 'Otros' },
];

export default function BottomSheet({
  visible,
  onClose,
  initialType = 'expense',
  onSubmitExpense,
  onSubmitIncome,
}) {
  const colors = useTheme();
  const { settings } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const isDark = settings.theme === 'dark';

  const [type, setType] = useState(initialType);
  const [rawAmount, setRawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setRawAmount('');
      setDescription('');
      setSelectedCategory(null);
      setLoading(false);
      setScanning(false);
    }
  }, [visible, initialType]);

  const processScanResult = async (uri) => {
    setScanning(true);
    try {
      const result = await api.scanTicket(uri);
      if (result.amount > 0) setRawAmount(String(Math.round(result.amount)));
      if (result.description !== '') setDescription(result.description);
      if (result.confidence < 0.6) Alert.alert('', t.addExpense.lowConfidence);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setScanning(false);
    }
  };

  const handleScanTicket = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;
    await processScanResult(result.assets[0].uri);
  };

  const handleOpenCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    await processScanResult(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    const normalized = rawAmount.replace(',', '.');
    const parsedAmount = parseFloat(normalized);
    if (!normalized || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t.addExpense.invalidAmount, t.addExpense.invalidAmountMsg);
      return;
    }
    if (type === 'expense' && !description) {
      Alert.alert(t.addExpense.requiredFields, t.addExpense.requiredFieldsMsg);
      return;
    }

    setLoading(true);
    try {
      if (type === 'expense') {
        await onSubmitExpense?.({
          amount: parsedAmount,
          description: description.trim(),
          category: selectedCategory,
          date: new Date().toISOString().split('T')[0],
          source: 'manual',
        });
      } else {
        await onSubmitIncome?.({
          amount: parsedAmount,
          description: description.trim() || null,
          date: new Date().toISOString().split('T')[0],
        });
      }
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
      backgroundColor: 'rgba(10, 22, 40, 0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '93%',
      borderTopWidth: 1,
      borderColor: colors.border,
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
    typeToggle: {
      flexDirection: 'row',
      margin: spacing.md,
      marginTop: 0,
      padding: 4,
      backgroundColor: colors.background,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    typeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: borderRadius.full,
    },
    typeBtnText: {
      fontSize: 14,
      fontWeight: '600',
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
    },
    amountDisplay: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    amountLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 6,
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
    scanRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    scanBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scanBtnText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.primary,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
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
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
    submitContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    submitBtnText: {
      fontSize: 16,
      fontWeight: '600',
    },
  }), [colors]);

  const isExpense = type === 'expense';
  const accentColor = isExpense ? colors.danger : colors.primary;
  const amountColor = rawAmount ? (isExpense ? colors.textPrimary : colors.primary) : colors.textTertiary;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {/* Type toggle */}
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    !isExpense && { backgroundColor: 'transparent' },
                    isExpense && { backgroundColor: colors.danger + '18', borderWidth: 1, borderColor: colors.danger + '50' },
                  ]}
                  onPress={() => setType('expense')}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="remove" size={16} color={isExpense ? colors.danger : colors.textTertiary} />
                  <Text style={[styles.typeBtnText, { color: isExpense ? colors.danger : colors.textTertiary }]}>
                    {t.addExpense.expense}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    isExpense && { backgroundColor: 'transparent' },
                    !isExpense && { backgroundColor: colors.primary + '18', borderWidth: 1, borderColor: colors.primary + '50' },
                  ]}
                  onPress={() => setType('income')}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={16} color={!isExpense ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.typeBtnText, { color: !isExpense ? colors.primary : colors.textTertiary }]}>
                    {t.addExpense.income}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.scrollContent}>
                  {/* Amount input */}
                  <View style={styles.amountDisplay}>
                    <Text style={[styles.amountLabel, { color: accentColor }]}>
                      {isExpense ? t.addExpense.howMuchSpent : t.addExpense.howMuchReceived}
                    </Text>
                    <View style={styles.amountRow}>
                      <Text style={styles.currencySign}>{isExpense ? '-' : '+'}{currency.symbol}</Text>
                      <TextInput
                        style={[styles.amountInput, { color: amountColor }]}
                        value={rawAmount}
                        onChangeText={(text) => setRawAmount(text.replace(/[^0-9.,]/g, ''))}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textTertiary}
                        maxLength={12}
                      />
                    </View>
                  </View>

                  {/* Scan buttons (expense only) */}
                  {isExpense && (
                    <View style={styles.scanRow}>
                      <TouchableOpacity style={styles.scanBtn} onPress={handleOpenCamera} activeOpacity={0.7}>
                        {scanning ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <MaterialIcons name="photo-camera" size={18} color={colors.primary} />
                        )}
                        <Text style={styles.scanBtnText}>{t.addExpense.openCamera}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.scanBtn} onPress={handleScanTicket} activeOpacity={0.7}>
                        {scanning ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <MaterialIcons name="document-scanner" size={18} color={colors.primary} />
                        )}
                        <Text style={styles.scanBtnText}>{t.addExpense.scanTicket}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Description */}
                  <Text style={styles.fieldLabel}>
                    {isExpense ? t.addExpense.placeholder : t.addIncome.placeholder}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={isExpense ? t.addExpense.example : t.addIncome.example}
                    placeholderTextColor={colors.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    maxLength={200}
                    returnKeyType="done"
                  />

                  {/* Category grid (expense only) */}
                  {isExpense && (
                    <>
                      <Text style={styles.fieldLabel}>{t.addExpense.category}</Text>
                      <View style={styles.categoryGrid}>
                        {CATEGORIES.map((cat) => {
                          const isSelected = selectedCategory === cat.name;
                          const catColor = colors.categories[cat.name] || colors.textTertiary;
                          return (
                            <TouchableOpacity
                              key={cat.name}
                              style={[
                                styles.categoryChip,
                                {
                                  backgroundColor: isSelected ? catColor + '18' : colors.background,
                                  borderColor: isSelected ? catColor : colors.border,
                                },
                              ]}
                              onPress={() => setSelectedCategory(isSelected ? null : cat.name)}
                              activeOpacity={0.7}
                            >
                              <CategoryIcon
                                category={cat.name}
                                color={catColor}
                                size={18}
                                containerSize={34}
                                style={{ backgroundColor: isSelected ? catColor + '25' : catColor + '14' }}
                              />
                              <Text style={[
                                styles.categoryChipLabel,
                                { color: isSelected ? catColor : colors.textSecondary },
                              ]}>
                                {t.categories?.[cat.name] || cat.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>

              {/* Submit button */}
              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: accentColor, opacity: loading ? 0.7 : 1 },
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#fff" />
                      <Text style={[styles.submitBtnText, { color: '#fff' }]}>
                        {isExpense ? t.addExpense.save : t.addIncome.save}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
