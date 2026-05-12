import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';
import SwipeableScreen from '../components/SwipeableScreen';

const CURRENCIES = [
  { code: 'ARS', symbol: '$',   name: 'Peso argentino' },
  { code: 'USD', symbol: 'US$', name: 'Dólar estadounidense' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'Libra esterlina' },
];

const LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
];

export default function SettingsScreen({ navigation }) {
  const colors = useTheme();
  const { settings, setTheme, setCurrency, setLanguage } = useSettings();
  const t = useTranslation();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: spacing.xxl,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 2,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      ...shadows.sm,
    },
    themeRow: {
      flexDirection: 'row',
      padding: spacing.sm,
      gap: spacing.sm,
    },
    themeOption: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    themeOptionActive: {
      backgroundColor: colors.primaryLight,
    },
    themeOptionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    themeOptionTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    optionRowLast: {
      borderBottomWidth: 0,
    },
    currencySymbol: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
      width: 40,
      textAlign: 'center',
    },
    optionName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
    langName: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    footerText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
  }), [colors]);

  return (
    <SwipeableScreen navigation={navigation} currentIndex={3} totalTabs={4}>
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.settings.title}</Text>
          <Text style={styles.subtitle}>{t.settings.subtitle}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t.settings.appearance}</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'light' && styles.themeOptionActive]}
              onPress={() => setTheme('light')}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeOptionText, settings.theme === 'light' && styles.themeOptionTextActive]}>
                {t.settings.light}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, settings.theme === 'dark' && styles.themeOptionActive]}
              onPress={() => setTheme('dark')}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeOptionText, settings.theme === 'dark' && styles.themeOptionTextActive]}>
                {t.settings.dark}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t.settings.currency}</Text>
        <View style={styles.card}>
          {CURRENCIES.map((currency, i) => {
            const isSelected = settings.currency.code === currency.code;
            const isLast = i === CURRENCIES.length - 1;
            return (
              <TouchableOpacity
                key={currency.code}
                style={[styles.optionRow, isLast && styles.optionRowLast]}
                onPress={() => setCurrency(currency)}
                activeOpacity={0.7}
              >
                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                <Text style={styles.optionName}>{currency.name}</Text>
                {isSelected && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{t.settings.language}</Text>
        <View style={styles.card}>
          {LANGUAGES.map((lang, i) => {
            const isSelected = settings.language === lang.code;
            const isLast = i === LANGUAGES.length - 1;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.optionRow, isLast && styles.optionRowLast]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langName}>{lang.name}</Text>
                {isSelected && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.settings.version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </SwipeableScreen>
  );
}
