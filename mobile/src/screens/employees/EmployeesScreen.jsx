import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { ownerAPI } from '../../api/endpoints';

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState({ name: '', hrCode: '', password: '' });

  function load() {
    ownerAPI.getEmployees().then(({ data }) => setEmployees(data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function createEmployee() {
    if (!form.name || !form.hrCode || !form.password) return;
    await ownerAPI.createEmployee(form);
    setModal(false);
    setForm({ name: '', hrCode: '', password: '' });
    load();
  }

  async function toggleBlock(id, blocked) {
    await ownerAPI.blockEmployee(id, { blocked: !blocked });
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, is_blocked: !blocked } : e));
  }

  async function remove(id, name) {
    Alert.alert('Sil', `"${name}" işçisini silmək istəyirsiniz?`, [
      { text: 'Xeyr' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        await ownerAPI.deleteEmployee(id);
        setEmployees(prev => prev.filter(e => e.id !== id));
      }},
    ]);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#FF6B35" size="large" /></View>;

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
        <Text style={s.addBtnText}>+ Yeni İşçi</Text>
      </TouchableOpacity>

      <FlatList
        data={employees}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={[s.card, item.is_blocked && s.cardBlocked]}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.hrCode}>HR: {item.hr_code}</Text>
              {item.is_blocked && <Text style={s.blockedBadge}>BLOKLANIB</Text>}
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={[s.actionBtn, item.is_blocked ? s.unblockBtn : s.blockBtn]}
                onPress={() => toggleBlock(item.id, item.is_blocked)}>
                <Text style={item.is_blocked ? s.unblockText : s.blockText}>
                  {item.is_blocked ? 'Aç' : 'Blok'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delBtn} onPress={() => remove(item.id, item.name)}>
                <Text style={s.delText}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>İşçi yoxdur</Text>}
      />

      {/* Yeni işçi modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Yeni İşçi</Text>
            <TextInput style={s.input} placeholder="Ad Soyad" value={form.name} onChangeText={v => setForm(f => ({...f, name: v}))} />
            <TextInput style={s.input} placeholder="HR Kodu (məs. EMP001)" value={form.hrCode} onChangeText={v => setForm(f => ({...f, hrCode: v}))} autoCapitalize="characters" />
            <TextInput style={s.input} placeholder="Şifrə" value={form.password} onChangeText={v => setForm(f => ({...f, password: v}))} secureTextEntry />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity style={[s.modalBtn, s.cancelBtn]} onPress={() => setModal(false)}>
                <Text>Ləğv et</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.saveBtn]} onPress={createEmployee}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Yarat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn:    { margin: 16, backgroundColor: '#FF6B35', borderRadius: 12, padding: 14, alignItems: 'center' },
  addBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  card:      { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', gap: 12 },
  cardBlocked:{ opacity: .6 },
  name:      { fontSize: 14, fontWeight: '700', color: '#212529' },
  hrCode:    { fontSize: 12, color: '#6C757D', marginTop: 2 },
  blockedBadge: { fontSize: 11, color: '#E63946', fontWeight: '700', marginTop: 2 },
  actions:   { gap: 6 },
  actionBtn: { borderRadius: 8, padding: 8, minWidth: 58, alignItems: 'center' },
  blockBtn:  { backgroundColor: '#FFF3CD' },
  unblockBtn:{ backgroundColor: '#D4EDDA' },
  blockText: { color: '#856404', fontWeight: '600', fontSize: 12 },
  unblockText:{ color: '#155724', fontWeight: '600', fontSize: 12 },
  delBtn:    { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8, alignItems: 'center' },
  delText:   { color: '#E63946', fontWeight: '600', fontSize: 12 },
  empty:     { textAlign: 'center', color: '#ADB5BD', padding: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle:{ fontSize: 18, fontWeight: '800', marginBottom: 16 },
  input:     { borderWidth: 1.5, borderColor: '#E9ECEF', borderRadius: 10, padding: 12, marginBottom: 10 },
  modalBtn:  { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F1F3F5' },
  saveBtn:   { backgroundColor: '#FF6B35' },
});
