import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  PENDING: '#F59E0B',
  PROCESSING: '#3B82F6',
  DONE: '#10B981',
  FAILED: '#EF4444',
};

const STATUS_LABELS = {
  PENDING: 'Bekliyor',
  PROCESSING: 'İşleniyor',
  DONE: 'Tamamlandı',
  FAILED: 'Hata',
};

export default function ReceiptCard({ receipt, onPress }) {
  const color = STATUS_COLORS[receipt.status] || '#6B7280';
  const date = receipt.purchase_date
    ? new Date(receipt.purchase_date).toLocaleDateString('tr-TR')
    : '—';
  const total = receipt.total_amount
    ? `${parseFloat(receipt.total_amount).toFixed(2)} ₺`
    : '—';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.total}>{total}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.badgeText, { color }]}>{STATUS_LABELS[receipt.status]}</Text>
        </View>
      </View>
      {receipt.processing_method && (
        <Text style={styles.method}>{receipt.processing_method.replace(/_/g, ' + ')}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { gap: 4 },
  date: { fontSize: 13, color: '#6B7280' },
  total: { fontSize: 20, fontWeight: '700', color: '#111827' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  method: { marginTop: 6, fontSize: 11, color: '#9CA3AF' },
});
