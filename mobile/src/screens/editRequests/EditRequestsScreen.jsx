import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { ownerAPI } from '../../api/endpoints';

export default function EditRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);

  function load() {
    ownerAPI.getEditRequests({ status: 'pending' })
      .then(({ data }) => setRequests(data))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function approve(id) {
    await ownerAPI.approveRequest(id);
    setRequests(prev => prev.filter(r => r.id !== id));
    Alert.alert('Təsdiqləndi', 'Dəyişiklik tətbiq edildi.');
  }

  async function reject(id) {
    await ownerAPI.rejectRequest(id);
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#FF6B35" size="large" /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={requests}
        keyExtractor={r => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.employee}>{item.employee_name} ({item.hr_code})</Text>
            <Text style={s.product}>Məhsul: {item.product_name}</Text>
            <Text style={s.changes}>
              Dəyişiklik: {JSON.stringify(item.requested_changes)}
            </Text>
            <View style={s.commentBox}>
              <Text style={s.commentLabel}>Şərh:</Text>
              <Text style={s.comment}>{item.comment}</Text>
            </View>
            <Text style={s.date}>{new Date(item.created_at).toLocaleString('az')}</Text>
            <View style={s.actions}>
              <TouchableOpacity style={s.approveBtn} onPress={() => approve(item.id)}>
                <Text style={s.approveText}>✓ Təsdiqlə</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.rejectBtn} onPress={() => reject(item.id)}>
                <Text style={s.rejectText}>✕ Rədd et</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>Gözləyən sorğu yoxdur</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8F9FA' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: '#FF6B35' },
  employee:     { fontSize: 15, fontWeight: '700', color: '#212529' },
  product:      { fontSize: 13, color: '#4361EE', marginTop: 4 },
  changes:      { fontSize: 12, color: '#6C757D', marginTop: 6, fontFamily: 'monospace' },
  commentBox:   { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 10, marginTop: 8 },
  commentLabel: { fontSize: 11, color: '#6C757D', fontWeight: '600' },
  comment:      { fontSize: 13, color: '#212529', marginTop: 2 },
  date:         { fontSize: 11, color: '#ADB5BD', marginTop: 6 },
  actions:      { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveBtn:   { flex: 1, backgroundColor: '#D4EDDA', borderRadius: 10, padding: 12, alignItems: 'center' },
  approveText:  { color: '#155724', fontWeight: '700' },
  rejectBtn:    { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, alignItems: 'center' },
  rejectText:   { color: '#E63946', fontWeight: '700' },
  empty:        { textAlign: 'center', color: '#ADB5BD', padding: 48, fontSize: 14 },
});
