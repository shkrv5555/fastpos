import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal,
  StyleSheet, ActivityIndicator, Alert, TextInput, Switch, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ownerAPI } from '../../api/endpoints';

export default function DiscountsScreen() {
  const [discounts, setDiscounts] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState({
    productId:     '',
    discountType:  'percentage',
    discountValue: '',
    endsAt:        '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  async function load() {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([ownerAPI.getDiscounts(), ownerAPI.getProducts()]);
      setDiscounts(d.data);
      setProducts(p.data);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function validate() {
    const e = {};
    if (!form.productId)          e.productId     = 'Məhsul seçin';
    if (!form.discountValue ||
        isNaN(parseFloat(form.discountValue)) ||
        parseFloat(form.discountValue) <= 0)       e.discountValue = 'Düzgün dəyər daxil edin';
    if (form.discountType === 'percentage' &&
        parseFloat(form.discountValue) > 100)      e.discountValue = 'Faiz 100-dən çox ola bilməz';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function createDiscount() {
    if (!validate()) return;
    setSaving(true);
    try {
      await ownerAPI.createDiscount({
        productId:     form.productId,
        discountType:  form.discountType,
        discountValue: parseFloat(form.discountValue),
        endsAt:        form.endsAt || undefined,
      });
      setModal(false);
      setForm({ productId: '', discountType: 'percentage', discountValue: '', endsAt: '' });
      load();
      Alert.alert('Uğurlu', 'Endirim yaradıldı');
    } catch (err) {
      Alert.alert('Xəta', err.response?.data?.error || 'Xəta baş verdi');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id) {
    try {
      const { data } = await ownerAPI.toggleDiscount(id);
      setDiscounts(prev => prev.map(d => d.id === id ? { ...d, is_active: data.is_active } : d));
    } catch {
      Alert.alert('Xəta', 'Əməliyyat uğursuz oldu');
    }
  }

  async function remove(id, name) {
    Alert.alert('Endirimi sil', `"${name}" məhsulunun endirimi silinsin?`, [
      { text: 'Xeyr', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          await ownerAPI.deleteDiscount(id);
          setDiscounts(prev => prev.filter(d => d.id !== id));
        },
      },
    ]);
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#FF6B35" size="large" /></View>;

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
        <Text style={s.addBtnText}>+ Yeni Endirim</Text>
      </TouchableOpacity>

      <FlatList
        data={discounts}
        keyExtractor={d => String(d.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={<Text style={s.empty}>Endirim yoxdur</Text>}
        renderItem={({ item }) => {
          const discountText = item.discount_type === 'percentage'
            ? `-${item.discount_value}%`
            : `-${parseFloat(item.discount_value).toFixed(2)} ₼`;
          return (
            <View style={[s.card, !item.is_active && s.cardInactive]}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.productName}>{item.product_name}</Text>
                  <Text style={s.discountLabel}>{discountText}</Text>
                  <Text style={s.basePriceText}>
                    Əsas qiymət: {parseFloat(item.base_price).toFixed(2)} ₼
                  </Text>
                  {item.ends_at && (
                    <Text style={s.expiryText}>
                      ⏰ {new Date(item.ends_at).toLocaleDateString('az-AZ')} tarixinə qədər
                    </Text>
                  )}
                </View>
                <Switch
                  value={item.is_active}
                  onValueChange={() => toggle(item.id)}
                  trackColor={{ true: '#FF6B35' }}
                />
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={s.delBtn}
                  onPress={() => remove(item.id, item.product_name)}
                >
                  <Text style={s.delBtnText}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Yeni endirim modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={s.overlay}>
          <ScrollView>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Yeni Endirim Yarat</Text>

              {/* Məhsul seçimi */}
              <Text style={s.label}>Məhsul *</Text>
              <View style={s.pickerWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {products.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[s.productChip, form.productId === p.id && s.productChipActive]}
                      onPress={() => setForm(f => ({...f, productId: p.id}))}
                    >
                      <Text style={[s.productChipText, form.productId === p.id && s.productChipActiveText]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {errors.productId && <Text style={s.errorText}>{errors.productId}</Text>}

              {/* Endirim növü */}
              <Text style={s.label}>Endirim növü</Text>
              <View style={s.typeRow}>
                {['percentage', 'fixed'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.typeBtn, form.discountType === t && s.typeBtnActive]}
                    onPress={() => setForm(f => ({...f, discountType: t}))}
                  >
                    <Text style={[s.typeBtnText, form.discountType === t && s.typeBtnActiveText]}>
                      {t === 'percentage' ? 'Faiz (%)' : 'Sabit (₼)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dəyər */}
              <Text style={s.label}>
                Endirim dəyəri ({form.discountType === 'percentage' ? '%' : '₼'}) *
              </Text>
              <TextInput
                style={[s.input, errors.discountValue && s.inputError]}
                value={form.discountValue}
                onChangeText={v => setForm(f => ({...f, discountValue: v}))}
                keyboardType="decimal-pad"
                placeholder={form.discountType === 'percentage' ? 'Məs. 20' : 'Məs. 2.50'}
              />
              {errors.discountValue && <Text style={s.errorText}>{errors.discountValue}</Text>}

              {/* Bitmə tarixi */}
              <Text style={s.label}>Bitmə tarixi (isteğe bağlı)</Text>
              <TextInput
                style={s.input}
                value={form.endsAt}
                onChangeText={v => setForm(f => ({...f, endsAt: v}))}
                placeholder="YYYY-MM-DD HH:MM"
              />
              <Text style={s.hint}>Boş buraxılsa — müddətsiz</Text>

              {/* Düymələr */}
              <View style={s.modalActions}>
                <TouchableOpacity style={[s.modalBtn, s.cancelBtn]} onPress={() => setModal(false)}>
                  <Text style={s.cancelBtnText}>Ləğv et</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalBtn, s.saveBtn, saving && { opacity: .6 }]}
                  onPress={createDiscount}
                  disabled={saving}
                >
                  <Text style={s.saveBtnText}>{saving ? 'Yaradılır...' : 'Yarat'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBtn:      { margin: 16, marginBottom: 0, backgroundColor: '#FF6B35', borderRadius: 10, padding: 13, alignItems: 'center' },
  addBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  cardInactive:{ opacity: .6 },
  cardTop:     { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  productName: { fontSize: 15, fontWeight: '700', color: '#212529' },
  discountLabel:{ fontSize: 16, fontWeight: '800', color: '#E63946', marginTop: 2 },
  basePriceText:{ fontSize: 12, color: '#6C757D', marginTop: 2 },
  expiryText:  { fontSize: 11, color: '#856404', marginTop: 2 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  delBtn:      { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8, paddingHorizontal: 14 },
  delBtnText:  { color: '#E63946', fontWeight: '600', fontSize: 12 },
  empty:       { textAlign: 'center', color: '#ADB5BD', padding: 48 },
  // Modal
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,.5)', justifyContent: 'flex-end' },
  modalCard:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  label:       { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 6 },
  pickerWrap:  { marginBottom: 4 },
  productChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E9ECEF', backgroundColor: '#fff', marginRight: 6 },
  productChipActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B3511' },
  productChipText:   { fontSize: 12, fontWeight: '600', color: '#6C757D' },
  productChipActiveText: { color: '#FF6B35' },
  errorText:   { color: '#E63946', fontSize: 12, marginBottom: 10 },
  typeRow:     { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn:     { flex: 1, padding: 11, borderRadius: 8, borderWidth: 1.5, borderColor: '#E9ECEF', alignItems: 'center', backgroundColor: '#fff' },
  typeBtnActive: { borderColor: '#FF6B35', backgroundColor: '#FF6B3511' },
  typeBtnText:   { fontSize: 13, fontWeight: '600', color: '#6C757D' },
  typeBtnActiveText: { color: '#FF6B35' },
  input:       { borderWidth: 1.5, borderColor: '#DEE2E6', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#fff', marginBottom: 14 },
  inputError:  { borderColor: '#E63946' },
  hint:        { fontSize: 11, color: '#ADB5BD', marginTop: -10, marginBottom: 14 },
  modalActions:{ flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn:    { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  cancelBtn:   { backgroundColor: '#F1F3F5' },
  cancelBtnText:{ fontWeight: '600', color: '#6C757D' },
  saveBtn:     { backgroundColor: '#FF6B35' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
