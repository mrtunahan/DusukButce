import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  Alert, TouchableOpacity, Image,
} from 'react-native';
import { receiptsApi } from '../../services/api';

const STATUS_COLORS = { PENDING: '#F59E0B', PROCESSING: '#3B82F6', DONE: '#10B981', FAILED: '#EF4444' };
const STATUS_LABELS = { PENDING: 'Bekliyor', PROCESSING: 'İşleniyor', DONE: 'Tamamlandı', FAILED: 'Hata' };

export default function ReceiptDetailScreen({ route, navigation }) {
  const { id, polling } = route.params;
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  async function fetchReceipt() {
    try {
      const data = await receiptsApi.getOne(id);
      setReceipt(data);
      if (polling && ['PENDING', 'PROCESSING'].includes(data.status)) {
        pollRef.current = setTimeout(fetchReceipt, 3000);
      }
    } catch (err) {
      Alert.alert('Hata', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReceipt();
    return () => clearTimeout(pollRef.current);
  }, [id]);

  async function handleDelete() {
    Alert.alert('Fişi Sil', 'Bu fişi kalıcı olarak silmek istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          await receiptsApi.remove(id);
          navigation.goBack();
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  if (!receipt) return null;

  const isProcessing = ['PENDING', 'PROCESSING'].includes(receipt.status);
  const statusColor = STATUS_COLORS[receipt.status];
  const date = receipt.purchase_date
    ? new Date(receipt.purchase_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[receipt.status]}</Text>
        </View>
        {isProcessing && <ActivityIndicator size="small" color={statusColor} style={{ marginLeft: 8 }} />}
      </View>

      {receipt.image_url && (
        <Image source={{ uri: receipt.image_url }} style={styles.image} resizeMode="contain" />
      )}

      <View style={styles.section}>
        <Row label="Tarih" value={date} />
        <Row
          label="Toplam"
          value={receipt.total_amount ? `${parseFloat(receipt.total_amount).toFixed(2)} ₺` : '—'}
          bold
        />
        <Row label="İşlem Yöntemi" value={receipt.processing_method?.replace(/_/g, ' + ') || '—'} />
        {receipt.ocr_confidence != null && (
          <Row label="OCR Güveni" value={`%${Math.round(receipt.ocr_confidence * 100)}`} />
        )}
      </View>

      {receipt.items?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kalemler ({receipt.items.length})</Text>
          {receipt.items.map((item, i) => (
            <View key={i} style={styles.item}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName} numberOfLines={2}>{item.raw_name}</Text>
                <Text style={styles.itemMeta}>KDV %{item.kdv_rate} · Adet: {parseFloat(item.quantity)}</Text>
              </View>
              <Text style={styles.itemPrice}>{parseFloat(item.line_total).toFixed(2)} ₺</Text>
            </View>
          ))}
        </View>
      )}

      {isProcessing && (
        <View style={styles.processingBox}>
          <Text style={styles.processingText}>Fiş işleniyor, lütfen bekle...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Fişi Sil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '700', fontSize: 18 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontWeight: '600', fontSize: 14 },
  image: { width: '100%', height: 220, marginBottom: 8 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowLabel: { fontSize: 14, color: '#6B7280' },
  rowValue: { fontSize: 14, color: '#111827', maxWidth: '60%', textAlign: 'right' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, color: '#111827', fontWeight: '500' },
  itemMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  processingBox: { margin: 16, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, alignItems: 'center' },
  processingText: { color: '#4F46E5', fontWeight: '600' },
  deleteBtn: { margin: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', alignItems: 'center' },
  deleteText: { color: '#EF4444', fontWeight: '600' },
});
