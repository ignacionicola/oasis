import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Modal, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme';
import api from '../services/api';
import AddIncomeModal from './AddIncomeModal';

const MONTH_NAMES = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

export default function IncomesModal({ visible, month, year, onClose, onUpdate }) {
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
      'Eliminar ingreso',
      `¿Eliminar ingreso de $${formatAmount(income.amount)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
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

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemAmount}>${formatAmount(item.amount)}</Text>
        <Text style={styles.itemDescription}>
          {item.description || 'Sin descripción'}
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Ingresos de {MONTH_NAMES[month] || ''}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Lista */}
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
                <Text style={styles.emptyText}>No hay ingresos este mes</Text>
              </View>
            }
          />
        )}

        {/* Botón fijo abajo */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color={colors.textInverse} />
            <Text style={styles.addButtonText}>Agregar ingreso</Text>
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

function formatAmount(amount) {
  return amount.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const styles = StyleSheet.create({
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
});
