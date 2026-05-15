import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G } from 'react-native-svg';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import useTranslation from '../i18n';
import { spacing, borderRadius, shadows, fonts } from '../theme';
import { useAuth } from '../context/AuthContext';
import WelcomeScreen from './WelcomeScreen';

// Google "G" logo
function GoogleLogo({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.4 4 9.8 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3c-2 1.4-4.6 2.5-7.4 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3c-.4.4 6.7-4.9 6.7-15 0-1.3-.1-2.4-.4-3.5z" />
    </Svg>
  );
}

// Apple logo
function AppleLogo({ size = 18, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

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

function PasswordStrength({ password, colors }) {
  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  if (!password) return null;

  const labels = ['Débil', 'Aceptable', 'Buena', 'Fuerte'];
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

  const repeatError =
    isRegister && repeatPassword && password !== repeatPassword
      ? 'No coincide'
      : null;

  const validate = () => {
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', t.auth.invalidEmail);
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Error', t.auth.passwordTooShort);
      return false;
    }
    if (isRegister && password !== repeatPassword) {
      Alert.alert('Error', t.auth.passwordMismatch);
      return false;
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
      Alert.alert('Error', err.message);
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

    // magic link
    magicBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      marginTop: 4,
    },
    magicText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    // divider
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderLight,
    },
    dividerText: {
      fontFamily: fonts.sansBold,
      fontSize: 10.5,
      color: colors.textTertiary,
      letterSpacing: 0.14,
    },

    // OAuth
    oauthRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 2,
    },
    oauthBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? 'rgba(10, 18, 34, 0.55)' : colors.background,
    },
    oauthText: {
      fontFamily: fonts.sansSemi,
      fontSize: 13,
      color: colors.textPrimary,
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
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
            <Text style={styles.tagline}>Tu economía, ordenada</Text>
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
              {isRegister ? 'Creá tu cuenta' : 'Bienvenido de vuelta'}
            </Text>
            <Text style={styles.subhead}>
              {isRegister
                ? 'Solo email y contraseña. Cero papeleo.'
                : 'Seguimos donde lo dejamos.'}
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
              setFocused={setFieldFocused}
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
              setFocused={setFieldFocused}
              fieldKey="password"
            />

            {isRegister && <PasswordStrength password={password} colors={colors} />}

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
                setFocused={setFieldFocused}
                fieldKey="repeat"
              />
            )}

            {!isRegister && (
              <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
                <Text style={styles.forgotText}>¿Olvidaste la contraseña?</Text>
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

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O CONTINUAR CON</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth buttons */}
            <View style={styles.oauthRow}>
              <TouchableOpacity
                style={styles.oauthBtn}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Google', 'Próximamente')}
              >
                <GoogleLogo size={18} />
                <Text style={styles.oauthText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.oauthBtn}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Apple', 'Próximamente')}
              >
                <AppleLogo size={18} color={isDark ? '#FFFFFF' : '#000000'} />
                <Text style={styles.oauthText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Magic link */}
            <TouchableOpacity
              style={styles.magicBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Link mágico', 'Te enviaremos un link a tu email para iniciar sesión sin contraseña.')}
            >
              <MaterialIcons name="bolt" size={16} color={colors.primary} />
              <Text style={styles.magicText}>
                {isRegister ? 'Crear con link mágico' : 'Iniciar con link mágico'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer microcopy */}
          <Text style={styles.footerText}>
            {isRegister
              ? 'Al crear cuenta aceptás los '
              : 'Protegido con cifrado de extremo a extremo · '}
            {isRegister && (
              <>
                <Text style={styles.footerLink}>Términos</Text>
                <Text> y </Text>
                <Text style={styles.footerLink}>Política de privacidad</Text>
              </>
            )}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
