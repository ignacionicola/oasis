import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import useTheme from '../theme/useTheme';
import useTranslation from '../i18n';
import { spacing, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function AuthScreen() {
  const colors = useTheme();
  const t = useTranslation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

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
    container: { flex: 1, backgroundColor: colors.primaryLight },
    scroll: { flexGrow: 1 },
    header: {
      height: SCREEN_HEIGHT * 0.35,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    appName: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    formContainer: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -24,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    formTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
      letterSpacing: -0.3,
    },
    fieldGroup: {
      gap: spacing.xs,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
    },
    input: {
      flex: 1,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.textPrimary,
    },
    eyeButton: {
      padding: spacing.xs,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: spacing.sm,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
    },
    switchRow: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    switchText: {
      fontSize: 15,
      color: colors.textTertiary,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="account-balance-wallet"
                size={64}
                color={colors.primary}
              />
            </View>
            <Text style={styles.appName}>Plata</Text>
            <Text style={styles.tagline}>Tu economía personal, ordenada</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isRegister ? t.auth.register : t.auth.login}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.auth.email}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t.auth.password}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(v => !v)}
                  hitSlop={8}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={22}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isRegister && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t.auth.repeatPassword}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={repeatPassword}
                    onChangeText={setRepeatPassword}
                    secureTextEntry={!showRepeat}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowRepeat(v => !v)}
                    hitSlop={8}
                  >
                    <MaterialIcons
                      name={showRepeat ? 'visibility' : 'visibility-off'}
                      size={22}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.buttonText}>
                    {isRegister ? t.auth.register : t.auth.login}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchRow}
              onPress={() => {
                setMode(isRegister ? 'login' : 'register');
                setPassword('');
                setRepeatPassword('');
                setShowPassword(false);
                setShowRepeat(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isRegister ? t.auth.hasAccount : t.auth.noAccount}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
