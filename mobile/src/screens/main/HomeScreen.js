import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { receiptsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReceiptCard from '../../components/ReceiptCard';

export default function HomeScreen({ navigation }) {
  const { logout } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchReceipts = useCallback(async (p = 1, reset = false) => {
    try {
      const data = await receiptsApi.list(p);
      setTotal(data.total);
      setReceipts((prev) => (reset ? data.data : [...prev, ...data.data]));
      setHasMore(data.data.length === data.limit);
      setPage(p);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReceipts(1, true).finally(() => setLoading(false));
  }, [fetchReceipts]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchReceipts(1, true);
    setRefreshing(false);
  }

  function onEndReached() {
    if (hasMore && !loading) fetchReceipts(page + 1);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fişlerim</Text>
          <Text style={styles.subtitle}>{total} fiş kaydedildi</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ReceiptCard
            receipt={item}
            onPress={() => navigation.navigate('ReceiptDetail', { id: item._id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={receipts.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyText}>Henüz fiş eklemedin</Text>
            <Text style={styles.emptyHint}>Kamera sekmesinden ilk fişini ekle</Text>
          </View>
        }
        ListFooterComponent={
          hasMore && receipts.length > 0 ? (
            <ActivityIndicator color="#4F46E5" style={{ marginVertical: 16 }} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  logout: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  list: { padding: 16 },
  empty: { flexGrow: 1 },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptyHint: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});
