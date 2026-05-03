import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { insightsApi } from '../../services/api';

export default function InsightsScreen() {
  const [inflation, setInflation] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchAll() {
    try {
      const [inf, anom] = await Promise.allSettled([
        insightsApi.inflation(),
        insightsApi.anomalies(),
      ]);
      if (inf.status === 'fulfilled') setInflation(inf.value);
      if (anom.status === 'fulfilled') setAnomalies(anom.value);
    } catch {}
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  const inflationRate = inflation?.inflation_rate;
  const inflationPct = inflationRate != null ? (inflationRate * 100).toFixed(1) : null;
  const inflationColor = inflationRate > 0.1 ? '#EF4444' : inflationRate > 0.05 ? '#F59E0B' : '#10B981';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
    >
      <Text style={styles.pageTitle}>Analizler</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sepet Enflasyonu (6 ay)</Text>
        {inflationPct != null ? (
          <View style={styles.inflationRow}>
            <Text style={[styles.inflationValue, { color: inflationColor }]}>
              {inflationRate > 0 ? '+' : ''}{inflationPct}%
            </Text>
            <Text style={styles.inflationSub}>
              {inflation.product_count} ürün bazında hesaplandı
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Yeterli veri yok. Birkaç fiş daha ekle.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Şüpheli Fiyatlar</Text>
        <Text style={styles.cardSub}>Ortalamanın ±%20'sinden sapanlar</Text>

        {anomalies.length === 0 ? (
          <Text style={styles.emptyText}>Anormal fiyat bulunamadı 👍</Text>
        ) : (
          anomalies.slice(0, 10).map((item, i) => (
            <View key={i} style={styles.anomalyItem}>
              <View style={styles.anomalyLeft}>
                <Text style={styles.anomalyName} numberOfLines={1}>{item.raw_name}</Text>
                <Text style={styles.anomalyMeta}>
                  Ortalama: {parseFloat(item.product?.current_avg_price || 0).toFixed(2)} ₺
                </Text>
              </View>
              <Text style={styles.anomalyPrice}>
                {parseFloat(item.unit_price).toFixed(2)} ₺
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nasıl Çalışır?</Text>
        {[
          ['🔍 QR Kod', 'GİB QR kodu varsa tarih, tutar ve market otomatik okunur'],
          ['📄 OCR', 'QR yoksa Tesseract.js ile Türkçe metin tanıma yapılır'],
          ['🤖 LLM', 'Güven skoru düşükse Claude Haiku devreye girer'],
          ['📊 Analiz', 'Fiyat geçmişi market bazlı karşılaştırılır'],
        ].map(([title, desc]) => (
          <View key={title} style={styles.howItem}>
            <Text style={styles.howTitle}>{title}</Text>
            <Text style={styles.howDesc}>{desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#111827', padding: 20, paddingBottom: 8 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 18, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  inflationRow: { marginTop: 8 },
  inflationValue: { fontSize: 40, fontWeight: '800' },
  inflationSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  anomalyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  anomalyLeft: { flex: 1, marginRight: 12 },
  anomalyName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  anomalyMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  anomalyPrice: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  howItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  howTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  howDesc: { fontSize: 13, color: '#6B7280', marginTop: 3, lineHeight: 18 },
});
