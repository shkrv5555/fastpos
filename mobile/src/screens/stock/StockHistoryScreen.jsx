import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { ownerAPI } from '../../api/endpoints';

export default function StockHistoryScreen({ route }) {
  const productId = route.params?.productId;
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [offset,  setOffset]    = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const LIMIT = 30;

  async function load(reset = false) {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    try {
      const { data } = await ownerAPI.getStockHistory({
        productId,
        limit: LIMIT,
        offset: currentOffset,
      });
      if (reset) {
        setRecords(data);
        setOffset(LIMIT);
      } else {
        setRecords(prev => [...prev, ...data]);
        setOffset(currentOffset + LIMIT);
      }
      setHasMore(data.length === LIMIT);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(true); }, []);

  return (
    <View style={s.container}>
      <FlatList
        data={records}
        keyExtractor={r => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.productName}>{item.product_name}</Text>
              <Text style={s.qty}>+{item.quantity}</Text>
            </View>
            <Text style={s.employee}>{item.employee_name} ({item.hr_code})</Text>
            <Text style={s.date}>{new Date(item.created_at).toLocaleString('az-AZ')}</Text>
            {item.notes && <Text style={s.notes}>📝 {item.notes}</Text>}
          </View>
        )}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={s.loadMoreBtn} onPress={() => load()}>
              {loading
                ? <ActivityIndicator color="#FF6B35" />
                : <Text style={s.loadMoreText}>Daha çox yüklə</Text>
              }
            </TouchableOpacity>
          ) : (
            <Text style={s.end}>Bütün qeydlər göstərildi</Text>
          )
        }
        ListEmptyComponent={
          !loading && <Text style={s.empty}>Stok daxiletmə qeydi yoxdur</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8F9FA' },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName:  { fontSize: 14, fontWeight: '700', color: '#212529', flex: 1 },
  qty:          { fontSize: 16, fontWeight: '800', color: '#2DC653' },
  employee:     { fontSize: 12, color: '#4361EE', marginBottom: 2 },
  date:         { fontSize: 11, color: '#ADB5BD' },
  notes:        { fontSize: 12, color: '#6C757D', marginTop: 4 },
  loadMoreBtn:  { padding: 16, alignItems: 'center' },
  loadMoreText: { color: '#FF6B35', fontWeight: '600' },
  end:          { textAlign: 'center', color: '#ADB5BD', padding: 16 },
  empty:        { textAlign: 'center', color: '#ADB5BD', padding: 48 },
});
