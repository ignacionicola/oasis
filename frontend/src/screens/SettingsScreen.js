import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import api from '../services/api';
import { formatCurrency } from '../utils/currency';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { spacing, borderRadius, shadows } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import useTranslation from '../i18n';
import SwipeableScreen from '../components/SwipeableScreen';

const CURRENCIES = [
  { code: 'ARS', symbol: '$',   name: 'Peso argentino' },
  { code: 'USD', symbol: 'US$', name: 'Dólar estadounidense' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'GBP', symbol: '£',   name: 'Libra esterlina' },
];

const LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default function SettingsScreen({ navigation }) {
  const colors = useTheme();
  const { settings, setTheme, setCurrency, setLanguage } = useSettings();
  const { currency } = settings;
  const { user, logout } = useAuth();
  const isDark = settings.theme === 'dark';
  const t = useTranslation();

  const [summary, setSummary] = useState(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [budgetAlertEnabled, setBudgetAlertEnabled] = useState(true);

  useEffect(() => {
    const now = new Date();
    api.getMonthSummary(now.getMonth() + 1, now.getFullYear())
      .then(setSummary)
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert(t.auth.logoutConfirm, t.auth.logoutConfirmMsg, [
      { text: t.auth.cancel, style: 'cancel' },
      { text: t.auth.logout, style: 'destructive', onPress: logout },
    ]);
  };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 110 },
    headerRow: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    title: {
      fontSize: 26, fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontSize: 13.5,
      color: colors.textTertiary,
      marginTop: 4,
    },
    profileCard: {
      marginHorizontal: spacing.lg,
      borderRadius: 24,
      padding: spacing.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isDark ? '#233050' : colors.border,
      backgroundColor: isDark ? '#0F1E34' : colors.surface,
      ...shadows.md,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 56, height: 56,
      borderRadius: 18,
      backgroundColor: colors.primary + '25',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.primary + '40',
    },
    avatarText: {
      fontSize: 24, fontWeight: '700',
      color: colors.primary,
    },
    profileInfo: { flex: 1, gap: 6 },
    profileEmail: {
      fontSize: 15, fontWeight: '600',
      color: colors.textPrimary,
    },
    planBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 3,
      backgroundColor: colors.primary + '20',
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    planText: {
      fontSize: 10.5, fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    // stats strip
    statsStrip: {
      flexDirection: 'row',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      gap: 4,
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },
    statValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    statLabel: {
      fontSize: 9.5,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.12,
      textTransform: 'uppercase',
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 4,
    },
    // toggle row
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: spacing.md,
    },
    toggleIcon: {
      width: 38, height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleTitle: {
      flex: 1,
      fontSize: 14.5, fontWeight: '500',
      color: colors.textPrimary,
    },
    toggleSub: {
      fontSize: 11.5,
      color: colors.textTertiary,
      marginTop: 1,
    },
    // link row
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: spacing.md,
    },
    sectionLabel: {
      fontSize: 11, fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.12,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    themeRow: {
      flexDirection: 'row',
      padding: 6,
      gap: 6,
    },
    themeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: borderRadius.md,
    },
    themeOptionActive: {
      backgroundColor: colors.primary + '18',
      borderWidth: 1,
      borderColor: colors.primary + '50',
    },
    themeOptionText: {
      fontSize: 13.5, fontWeight: '600',
      color: colors.textTertiary,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: spacing.md,
    },
    optionRowLast: {
      borderBottomWidth: 0,
    },
    currencyBadge: {
      width: 38, height: 38,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    currencySymbol: {
      fontSize: 15, fontWeight: '700',
      color: colors.primary,
    },
    langFlag: { fontSize: 24 },
    optionName: {
      flex: 1,
      fontSize: 14.5, fontWeight: '500',
      color: colors.textPrimary,
    },
    checkDot: {
      width: 22, height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      gap: spacing.md,
    },
    logoutIcon: {
      width: 38, height: 38,
      borderRadius: 12,
      backgroundColor: colors.danger + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutText: {
      flex: 1,
      fontSize: 14.5, fontWeight: '600',
      color: colors.danger,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      gap: 4,
    },
    footerBrand: {
      fontSize: 13, fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.3,
    },
    footerText: {
      fontSize: 11,
      color: colors.textQuaternary,
    },
  }), [colors, isDark]);

  return (
    <SwipeableScreen navigation={navigation} currentIndex={3} totalTabs={4}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t.settings.title}</Text>
            <Text style={styles.subtitle}>{t.settings.subtitle}</Text>
          </View>

          {/* profile card */}
          <View style={styles.profileCard}>
            <View style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160 }}>
              <Svg width={160} height={160}>
                <Defs>
                  <RadialGradient id="pglow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
                    <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={160} height={160} fill="url(#pglow)" />
              </Svg>
            </View>

            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.email?.[0] || '?').toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email}
                </Text>
                <View style={styles.planBadge}>
                  <MaterialIcons name="star" size={11} color={colors.primary} />
                  <Text style={styles.planText}>Plan Gratis</Text>
                </View>
              </View>
            </View>

            {/* Stats strip */}
            <View style={styles.statsStrip}>
              <View style={styles.statCell}>
                <Text style={styles.statValue}>
                  {summary ? formatCurrency(summary.total_spent || 0, currency) : '—'}
                </Text>
                <Text style={styles.statLabel}>En Plata</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>
                  {summary?.expense_count || 0}
                </Text>
                <Text style={styles.statLabel}>Movs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statValue}>Free</Text>
                <Text style={styles.statLabel}>Plan</Text>
              </View>
            </View>
          </View>

          {/* Appearance */}
          <Text style={styles.sectionLabel}>{t.settings.appearance}</Text>
          <View style={styles.card}>
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[styles.themeOption, !isDark && styles.themeOptionActive]}
                onPress={() => setTheme('light')}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="light-mode"
                  size={16}
                  color={!isDark ? colors.primary : colors.textTertiary}
                />
                <Text style={[
                  styles.themeOptionText,
                  !isDark && { color: colors.primary, fontWeight: '700' },
                ]}>
                  {t.settings.light}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeOption, isDark && styles.themeOptionActive]}
                onPress={() => setTheme('dark')}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="dark-mode"
                  size={16}
                  color={isDark ? colors.primary : colors.textTertiary}
                />
                <Text style={[
                  styles.themeOptionText,
                  isDark && { color: colors.primary, fontWeight: '700' },
                ]}>
                  {t.settings.dark}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Currency */}
          <Text style={styles.sectionLabel}>{t.settings.currency}</Text>
          <View style={styles.card}>
            {CURRENCIES.map((c, i) => {
              const isSel = settings.currency.code === c.code;
              const last = i === CURRENCIES.length - 1;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.optionRow, last && styles.optionRowLast]}
                  onPress={() => setCurrency(c)}
                  activeOpacity={0.7}
                >
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencySymbol}>{c.symbol}</Text>
                  </View>
                  <Text style={styles.optionName}>{c.name}</Text>
                  {isSel && (
                    <View style={styles.checkDot}>
                      <MaterialIcons name="check" size={14} color={colors.textInverse} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Language */}
          <Text style={styles.sectionLabel}>{t.settings.language}</Text>
          <View style={styles.card}>
            {LANGUAGES.map((l, i) => {
              const isSel = settings.language === l.code;
              const last = i === LANGUAGES.length - 1;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.optionRow, last && styles.optionRowLast]}
                  onPress={() => setLanguage(l.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langFlag}>{l.flag}</Text>
                  <Text style={styles.optionName}>{l.name}</Text>
                  {isSel && (
                    <View style={styles.checkDot}>
                      <MaterialIcons name="check" size={14} color={colors.textInverse} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preferencias */}
          <Text style={styles.sectionLabel}>Preferencias</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={[styles.toggleIcon, { backgroundColor: colors.primary + '18' }]}>
                <MaterialIcons name="notifications-none" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Notificaciones</Text>
                <Text style={styles.toggleSub}>Resumen diario y alertas</Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={notifEnabled ? colors.primary : colors.textTertiary}
              />
            </View>
            <View style={styles.toggleRow}>
              <View style={[styles.toggleIcon, { backgroundColor: colors.info + '18' }]}>
                <MaterialIcons name="fingerprint" size={18} color={colors.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Bloqueo biométrico</Text>
                <Text style={styles.toggleSub}>Huella o Face ID al abrir</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={biometricEnabled ? colors.primary : colors.textTertiary}
              />
            </View>
            <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.toggleIcon, { backgroundColor: colors.warning + '18' }]}>
                <MaterialIcons name="warning-amber" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Alerta de presupuesto</Text>
                <Text style={styles.toggleSub}>Avisar al 80% del límite</Text>
              </View>
              <Switch
                value={budgetAlertEnabled}
                onValueChange={setBudgetAlertEnabled}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={budgetAlertEnabled ? colors.primary : colors.textTertiary}
              />
            </View>
          </View>

          {/* Datos */}
          <Text style={styles.sectionLabel}>Datos</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
              <View style={[styles.toggleIcon, { backgroundColor: colors.primary + '15' }]}>
                <MaterialIcons name="file-download" size={18} color={colors.primary} />
              </View>
              <Text style={styles.toggleTitle}>Exportar a CSV</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textQuaternary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
              <View style={[styles.toggleIcon, { backgroundColor: colors.success + '15' }]}>
                <MaterialIcons name="cloud-done" size={18} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Backup en la nube</Text>
                <Text style={styles.toggleSub}>Sincronización activa</Text>
              </View>
              <MaterialIcons name="check-circle" size={18} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Eliminar datos', 'Esta acción no se puede deshacer.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive' },
              ])}
            >
              <View style={[styles.toggleIcon, { backgroundColor: colors.danger + '15' }]}>
                <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
              </View>
              <Text style={[styles.toggleTitle, { color: colors.danger }]}>
                Eliminar todos los datos
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textQuaternary} />
            </TouchableOpacity>
          </View>

          {/* Account */}
          <Text style={styles.sectionLabel}>{t.auth.account}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.logoutRow}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.logoutIcon}>
                <MaterialIcons name="logout" size={18} color={colors.danger} />
              </View>
              <Text style={styles.logoutText}>{t.auth.logout}</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textQuaternary} />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Plata</Text>
            <Text style={styles.footerText}>{t.settings.version}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SwipeableScreen>
  );
}
