import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ownerAPI } from '../../api/endpoints';

const SEGMENT_COLORS = { simple: '#4361EE', fast: '#FF6B35', premium: '#7C3AED' };

export default function ProductsScreen() {
  const navigation = useNavigation();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');

  async function load() {
    setLoading(true);
    try {
      const { data } = await ownerAPI.getProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }

  // Ekrana hər giriləndə yenilə (ProductEdit-dən qayıtdıqda)
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = products.filter(p => {
    const matchSearch  = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchSegment = filter === 'all' || p.segment === filter;
    return matchSearch && matchSegment;
  });

  async function toggleAvailability(product) {
    try {
      await ownerAPI.updateProduct(product.id, { is_available: !product.is_available });
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p)
      );
    } catch {
      Alert.alert('Xəta', 'Əməliyyat uğursuz oldu');
    }
  }

  async function deleteProduct(p) {
    Alert.alert('Məhsulu sil', `"${p.name}" silinsin?`, [
      { text: 'Xeyr', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await ownerAPI.deleteProduct(p.id);
            setProducts(prev => prev.filter(x => x.id !== p.id));
          } catch {
            Alert.alert('Xəta', 'Məhsul silinə bilmədi');
          }
        },
      },
    ]);
  }

  return (
    <View style={s.container}>
      {/* Axtarış */}
      <View style={s.searchBar}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Məhsul axtar..."
          clearButtonMode="while-editing"
        />
      </View>

      {/* Seqment filter */}
      <View style={s.filterRow}>
        {['all', 'simple', 'fast', 'premium'].map(seg => (
          <TouchableOpacity
            key={seg}
            style={[s.filterBtn, filter === seg && s.filterBtnActive]}
            onPress={() => setFilter(seg)}
          >
            <Text style={[s.filterBtnText, filter === seg && s.filterBtnActiveText]}>
              {seg === 'all' ? 'Hamısı' : seg === 'simple' ? 'Sadə' : seg === 'fast' ? 'Fast' : 'Premium'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Yeni məhsul */}
      <TouchableOpacity
        style={s.addBtn}
        onPress={() => navigation.navigate('ProductEdit', { product: null, onSave: load })}
      >
        <Text style={s.addBtnText}>+ Yeni Məhsul əlavə et</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#FF6B35" size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<Text style={s.empty}>Məhsul tapılmadı</Text>}
          renderItem={({ item }) => (
            <View style={[s.card, !item.is_available && s.cardDisabled]}>
              <View style={s.cardMain}>
                <View style={[s.segDot, { backgroundColor: SEGMENT_COLORS[item.segment] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <View style={s.meta}>
                    <Text style={s.price}>{parseFloat(item.final_price).toFixed(2)} ₼</Text>
                    {item.discount_id && (
                      <Text style={s.oldPrice}>{parseFloat(item.base_price).toFixed(2)} ₼</Text>
                    )}
                    <Text style={s.stock}>Stok: {item.stock_qty}</Text>
                  </View>
                  {!item.is_available && (
                    <Text style={s.unavailableBadge}>Satışda deyil</Text>
                  )}
                </View>
              </View>

              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.actionBtn, item.is_available ? s.hideBtn : s.showBtn]}
                  onPress={() => toggleAvailability(item)}
                >
                  <Text style={item.is_available ? s.hideBtnText : s.showBtnText}>
                    {item.is_available ? 'Gizlət' : 'Göstər'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.actionBtn, s.editBtn]}
                  onPress={() => navigation.navigate('ProductEdit', { product: item, onSave: load })}
                >
                  <Text style={s.editBtnText}>Düzəlt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.actionBtn, s.delBtn]}
                  onPress={() => deleteProduct(item)}
                >
                  <Text style={s.delBtnText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  searchBar:   { padding: 12, paddingBottom: 0 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E9ECEF',
    padding: 10, fontSize: 14,
  },
  filterRow:   { flexDirection: 'row', gap: 6, padding: 12 },
  filterBtn:   { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E9ECEF', alignItems: 'center', backgroundColor: '#fff' },
  filterBtnActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B3511' },
  filterBtnText:   { fontSize: 11, fontWeight: '600', color: '#6C757D' },
  filterBtnActiveText: { color: '#FF6B35' },
  addBtn:      { marginHorizontal: 12, marginBottom: 4, backgroundColor: '#FF6B35', borderRadius: 10, padding: 13, alignItems: 'center' },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  cardDisabled:{ opacity: .65 },
  cardMain:    { flexDirection: 'row', gap: 10, marginBottom: 10 },
  segDot:      { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  name:        { fontSize: 15, fontWeight: '700', color: '#212529' },
  meta:        { flexDirection: 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' },
  price:       { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
  oldPrice:    { fontSize: 12, color: '#ADB5BD', textDecorationLine: 'line-through', marginTop: 1 },
  stock:       { fontSize: 12, color: '#6C757D', marginTop: 1 },
  unavailableBadge: { fontSize: 11, color: '#E63946', fontWeight: '700', marginTop: 2 },
  actions:     { flexDirection: 'row', gap: 6 },
  actionBtn:   { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  hideBtn:     { backgroundColor: '#FFF3CD' },
  hideBtnText: { color: '#856404', fontSize: 12, fontWeight: '600' },
  showBtn:     { backgroundColor: '#D4EDDA' },
  showBtnText: { color: '#155724', fontSize: 12, fontWeight: '600' },
  editBtn:     { backgroundColor: '#EEF2FF' },
  editBtnText: { color: '#4361EE', fontSize: 12, fontWeight: '600' },
  delBtn:      { backgroundColor: '#FEE2E2' },
  delBtnText:  { color: '#E63946', fontSize: 12, fontWeight: '600' },
  empty:       { textAlign: 'center', color: '#ADB5BD', padding: 48 },
});
