import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';
import { spacing, borderRadius, shadows, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import WelcomeScreen from './WelcomeScreen';

function FloatInput({ label, value, onChangeText, icon, secure, onToggleSecure, secureVisible, error, keyboardType, autoCapitalize, colors, isDark, fieldFocused, setFocused, fieldKey }) {
  const isFocused = fieldFocused === fieldKey;
  const hasValue = value && value.length > 0;
  const floating = isFocused || hasValue;
  const anim = useRef(new Animated.Value(floating ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: floating ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [floating, anim]);

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 6] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 10.5] });
  const labelColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.textTertiary;

  const borderColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.border;

  return (
    <View style={{ marginBottom: 4 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(10, 18, 34, 0.55)' : colors.background,
        borderWidth: 1,
        borderColor,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        gap: 10,
        minHeight: 58,
      }}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={18}
            color={isFocused ? colors.primary : colors.textTertiary}
          />
        )}
        <View style={{ flex: 1, justifyContent: 'center', position: 'relative' }}>
          <Animated.Text style={{
            position: 'absolute',
            top: labelTop,
            fontSize: labelSize,
            fontWeight: floating ? '700' : '500',
            color: labelColor,
            letterSpacing: floating ? 0.12 : 0,
            textTransform: floating ? 'uppercase' : 'none',
          }}>
            {label}
          </Animated.Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secure && !secureVisible}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize || 'none'}
            autoCorrect={false}
            onFocus={() => setFocused(fieldKey)}
            onBlur={() => setFocused(null)}
            style={{
              fontSize: 15,
              color: colors.textPrimary,
              paddingTop: 18,
              paddingBottom: 6,
            }}
          />
        </View>
        {secure && (
          <TouchableOpacity onPress={onToggleSecure} hitSlop={8} style={{ padding: 4 }}>
            <MaterialIcons
              name={secureVisible ? 'visibility' : 'visibility-off'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{
          fontSize: 11.5,
          color: colors.danger,
          marginTop: 4,
          marginLeft: 4,
          fontWeight: '500',
        }}>
          {error}
        </Text>
      )}
    </View>
  );
}

function PasswordStrength({ password, colors, t }) {
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  if (!password) return null;

  const labels = [t.auth.strengthWeak, t.auth.strengthOk, t.auth.strengthGood, t.auth.strengthStrong];
  const segColors = [colors.danger, colors.warning, '#A8C840', colors.success];
  const label = labels[Math.max(0, strength - 1)] || labels[0];
  const color = segColors[Math.max(0, strength - 1)] || segColors[0];

  return (
    <View style={{ marginTop: 6, marginHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < strength ? color : colors.borderLight,
            }}
          />
        ))}
      </View>
      <Text style={{
        fontSize: 10.5,
        fontWeight: '700',
        color,
        marginTop: 4,
        letterSpacing: 0.12,
        textTransform: 'uppercase',
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function AuthScreen() {
  const colors = useTheme();
  const { settings } = useSettings();
  const isDark = settings.theme === 'dark';
  const t = useTranslation();
  const { login, register } = useAuth();

  const [view, setView] = useState('welcome');
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldFocused, setFieldFocused] = useState(null);

  const isRegister = mode === 'register';
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: isRegister ? 1 : 0,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [isRegister, tabAnim]);

  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  const scrollRef = useRef(null);
  const handleFieldFocus = (fieldKey) => {
    setFieldFocused(fieldKey);
    // Cuando el user toca password o repeat password, scrolleamos al fondo
    // para que el campo activo quede por encima del teclado.
    if (fieldKey === 'password' || fieldKey === 'repeat') {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const repeatError =
    isRegister && repeatPassword && password !== repeatPassword
      ? t.auth.passwordsDontMatch
      : null;

  const validate = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.trim())) {
      Alert.alert('Revisá los datos', 'Ingresá un email válido');
      return false;
    }
    if (isRegister) {
      if (password.length < 8) {
        Alert.alert('Revisá los datos', 'La contraseña necesita al menos 8 caracteres');
        return false;
      }
      if (/^\d+$/.test(password)) {
        Alert.alert('Revisá los datos', 'La contraseña no puede ser solo números');
        return false;
      }
      if (password === password.toLowerCase()) {
        Alert.alert('Revisá los datos', 'La contraseña necesita al menos una mayúscula');
        return false;
      }
      if (password !== repeatPassword) {
        Alert.alert('Revisá los datos', 'Las contraseñas no coinciden');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
    } catch (err) {
      let message = 'Algo salió mal. Intentá de nuevo.';
      const raw = String(err?.message ?? '');

      if (/fetch|network/i.test(raw)) {
        message = 'Sin conexión. Revisá tu internet.';
      } else if (err?.detail) {
        if (Array.isArray(err.detail)) {
          message = err.detail[0]?.msg || message;
        } else if (typeof err.detail === 'string') {
          message = err.detail;
        }
      } else if (raw && raw !== '[object Object]') {
        message = raw;
      }

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, paddingBottom: spacing.xl },

    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      alignItems: 'center',
    },
    logoBadge: {
      width: 72, height: 72,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      ...shadows.md,
      shadowColor: colors.primary,
      shadowOpacity: 0.45,
    },
    logoText: {
      fontFamily: fonts.displayBold,
      fontSize: 36,
      color: colors.textInverse,
      letterSpacing: -1,
    },
    appName: {
      fontFamily: fonts.displayBold,
      fontSize: 30,
      color: colors.textPrimary,
      letterSpacing: -0.8,
      marginBottom: 4,
    },
    tagline: {
      fontSize: 13.5,
      color: colors.textTertiary,
      textAlign: 'center',
    },

    // tab toggle with animated indicator
    tabContainer: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: 4,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
      height: 46,
    },
    tabIndicator: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      width: '50%',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.full,
    },
    tabRow: {
      flexDirection: 'row',
      height: 38,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabText: {
      fontSize: 13.5, fontWeight: '600',
      color: colors.textTertiary,
    },
    tabTextActive: {
      color: colors.textInverse,
      fontWeight: '700',
    },

    formCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: isDark ? '#0F1E34' : colors.surface,
      borderRadius: 24,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? '#233050' : colors.border,
      overflow: 'hidden',
      ...shadows.md,
      gap: 10,
    },
    headline: {
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 2,
    },
    subhead: {
      fontSize: 13,
      color: colors.textTertiary,
      marginBottom: spacing.md,
    },
    forgotRow: {
      alignItems: 'flex-end',
      marginTop: 2,
    },
    forgotText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textTertiary,
    },

    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: spacing.sm,
      ...shadows.sm,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
    },
    submitText: {
      color: colors.textInverse,
      fontSize: 16, fontWeight: '700',
      letterSpacing: 0.2,
    },

    // back button
    backBtn: {
      width: 38, height: 38,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: -spacing.sm,
    },

    footerText: {
      fontSize: 11.5,
      color: colors.textQuaternary,
      textAlign: 'center',
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      lineHeight: 17,
    },
    footerLink: {
      color: colors.primary,
      fontWeight: '700',
    },
  }), [colors, isDark]);

  if (view === 'welcome') {
    return (
      <WelcomeScreen
        onLogin={() => { setMode('login'); setView('form'); }}
        onSignup={() => { setMode('register'); setView('form'); }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setView('welcome')}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>P</Text>
            </View>
            <Text style={styles.appName}>Plata</Text>
            <Text style={styles.tagline}>{t.auth.tagline}</Text>
          </View>

          {/* Tab toggle with animated indicator */}
          <View style={styles.tabContainer}>
            <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setMode('login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>
                  {t.auth.login}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tab}
                onPress={() => setMode('register')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>
                  {t.auth.register}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            <View style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200 }}>
              <Svg width={200} height={200}>
                <Defs>
                  <RadialGradient id="aglow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
                    <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={200} height={200} fill="url(#aglow)" />
              </Svg>
            </View>

            <Text style={styles.headline}>
              {isRegister ? t.auth.headlineRegister : t.auth.headlineLogin}
            </Text>
            <Text style={styles.subhead}>
              {isRegister
                ? t.auth.subRegister
                : t.auth.subLogin}
            </Text>

            <FloatInput
              label={t.auth.email}
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              keyboardType="email-address"
              colors={colors}
              isDark={isDark}
              fieldFocused={fieldFocused}
              setFocused={handleFieldFocus}
              fieldKey="email"
            />

            <FloatInput
              label={t.auth.password}
              value={password}
              onChangeText={setPassword}
              icon="lock-outline"
              secure
              secureVisible={showPassword}
              onToggleSecure={() => setShowPassword(v => !v)}
              colors={colors}
              isDark={isDark}
              fieldFocused={fieldFocused}
              setFocused={handleFieldFocus}
              fieldKey="password"
            />

            {isRegister && <PasswordStrength password={password} colors={colors} t={t} />}

            {isRegister && (
              <FloatInput
                label={t.auth.repeatPassword}
                value={repeatPassword}
                onChangeText={setRepeatPassword}
                icon="lock-outline"
                secure
                secureVisible={showRepeat}
                onToggleSecure={() => setShowRepeat(v => !v)}
                error={repeatError}
                colors={colors}
                isDark={isDark}
                fieldFocused={fieldFocused}
                setFocused={handleFieldFocus}
                fieldKey="repeat"
              />
            )}

            {!isRegister && (
              <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
                <Text style={styles.forgotText}>{t.auth.forgot}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {isRegister ? t.auth.register : t.auth.login}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={18} color={colors.textInverse} />
                </>
              )}
            </TouchableOpacity>

          </View>

          {/* Footer microcopy */}
          <Text style={styles.footerText}>
            {isRegister
              ? t.auth.termsPrefix
              : t.auth.e2eFooter}
            {isRegister && (
              <>
                <Text style={styles.footerLink}>{t.auth.terms}</Text>
                <Text>{t.auth.and}</Text>
                <Text style={styles.footerLink}>{t.auth.privacy}</Text>
              </>
            )}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
