import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../theme';
import useTheme from '../theme/useTheme';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/currency';
import useTranslation from '../i18n';
import api from '../services/api';
import AddIncomeModal from './AddIncomeModal';

export default function IncomesModal({ visible, month, year, onClose, onUpdate }) {
  const colors = useTheme();
  const { settings } = useSettings();
  const { currency } = settings;
  const t = useTranslation();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const loadIncomes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getIncomes({ month, year });
      setIncomes(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (visible) loadIncomes();
  }, [visible, loadIncomes]);

  const handleDelete = (income) => {
    Alert.alert(
      t.incomes.confirmDelete,
      t.incomes.confirmDeleteMsg,
      [
        { text: t.incomes.cancel, style: 'cancel' },
        {
          text: t.incomes.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteIncome(income.id);
              await loadIncomes();
              onUpdate();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleAdd = async (data) => {
    await api.createIncome(data);
    await loadIncomes();
    onUpdate();
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    itemLeft: {
      flex: 1,
      gap: 3,
    },
    itemAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: -0.5,
    },
    itemDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    itemDate: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    deleteButton: {
      padding: spacing.xs,
    },
    separator: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginLeft: spacing.lg,
    },
    emptyState: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textTertiary,
      fontWeight: '500',
    },
    footer: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
    },
    addButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
  }), [colors]);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemAmount}>{formatCurrency(item.amount, currency)}</Text>
        <Text style={styles.itemDescription}>
          {item.description || t.incomes.noDescription}
        </Text>
        <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        hitSlop={12}
        style={styles.deleteButton}
      >
        <MaterialIcons name="delete-outline" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {t.incomes.title} {t.months[month] || ''}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={incomes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={incomes.length === 0 && styles.centered}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="savings" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>{t.incomes.noIncomes}</Text>
              </View>
            }
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color={colors.textInverse} />
            <Text style={styles.addButtonText}>{t.incomes.addIncome}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <AddIncomeModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAdd}
      />
    </Modal>
  );
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
