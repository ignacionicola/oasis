import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import useTheme from '../theme/useTheme';
import useTranslation from '../i18n';

export default function ErrorBanner({ message, onRetry }) {
  const colors = useTheme();
  const t = useTranslation();

  const styles = useMemo(() => StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.danger,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
    },
    message: {
      flex: 1,
      color: '#fff',
      fontSize: 13,
      lineHeight: 18,
    },
    retryButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
    },
    retryText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
  }), [colors]);

  return (
    <View style={styles.banner}>
      <MaterialIcons name="wifi-off" size={18} color="#fff" />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>{t.home.retry}</Text>
      </TouchableOpacity>
    </View>
  );
}
