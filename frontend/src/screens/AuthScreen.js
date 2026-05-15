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
import { spacing, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';

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
      fontSize: 36, fontWeight: '800',
      color: colors.textInverse,
      letterSpacing: -1,
    },
    appName: {
      fontSize: 30, fontWeight: '700',
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
      fontSize: 20, fontWeight: '700',
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
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.textTertiary,
      letterSpacing: 0.14,
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
