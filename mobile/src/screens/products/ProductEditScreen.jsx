import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ownerAPI } from '../../api/endpoints';

const SEGMENTS = ['simple', 'fast', 'premium'];

export default function ProductEditScreen({ route, navigation }) {
  const { product, onSave } = route.params || {};
  const isNew = !product;

  const [form, setForm] = useState({
    name:         product?.name        || '',
    description:  product?.description || '',
    base_price:   product?.base_price?.toString() || '',
    segment:      product?.segment     || 'simple',
    stock_qty:    product?.stock_qty?.toString()  || '0',
    is_available: product?.is_available ?? true,
    category_id:  product?.category_id || null,
  });

  const [categories,   setCategories]   = useState([]);
  const [ingredients,  setIngredients]  = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [imageUri,     setImageUri]     = useState(product?.image_url || null);
  const [imageFile,    setImageFile]    = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});

  useEffect(() => {
    Promise.all([
      ownerAPI.getCategories(),
      ownerAPI.getIngredients(),
    ]).then(([cats, ings]) => {
      setCategories(cats.data);
      setAllIngredients(ings.data);
    });

    if (product?.ingredients) {
      setIngredients(
        product.ingredients.map(i => ({
          ingredient_id: i.id,
          name:          i.name,
          unit:          i.unit,
          quantity:      i.quantity?.toString() || '0',
        }))
      );
    }
  }, []);

  function validate() {
    const e = {};
    if (!form.name.trim())           e.name       = 'Ad tələb olunur';
    if (!form.base_price ||
        isNaN(parseFloat(form.base_price)) ||
        parseFloat(form.base_price) < 0)  e.base_price = 'Düzgün qiymət daxil edin';
    if (isNaN(parseInt(form.stock_qty)) ||
        parseInt(form.stock_qty) < 0)     e.stock_qty  = 'Stok miqdarı 0 və ya daha çox';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İcazə lazımdır', 'Qalereya icazəsi verilməyib.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageFile(result.assets[0]);
    }
  }

  function toggleIngredient(ing) {
    setIngredients(prev => {
      const exists = prev.find(i => i.ingredient_id === ing.id);
      if (exists) return prev.filter(i => i.ingredient_id !== ing.id);
      return [...prev, { ingredient_id: ing.id, name: ing.name, unit: ing.unit, quantity: '1' }];
    });
  }

  function updateIngredientQty(ingredientId, qty) {
    setIngredients(prev =>
      prev.map(i => i.ingredient_id === ingredientId ? { ...i, quantity: qty } : i)
    );
  }

  async function handleSave() {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      name:         form.name.trim(),
      description:  form.description.trim() || undefined,
      base_price:   parseFloat(form.base_price),
      segment:      form.segment,
      stock_qty:    parseInt(form.stock_qty),
      is_available: form.is_available,
      category_id:  form.category_id || undefined,
      ingredients:  ingredients.map(i => ({
        ingredient_id: i.ingredient_id,
        quantity:      parseFloat(i.quantity) || 0,
      })),
    };

    try {
      let savedProduct;
      if (isNew) {
        const { data } = await ownerAPI.createProduct(payload);
        savedProduct = data;
      } else {
        const { data } = await ownerAPI.updateProduct(product.id, payload);
        savedProduct = data;
      }

      // Şəkil yüklə
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', {
          uri:  imageFile.uri,
          name: `product_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        await ownerAPI.uploadImage(savedProduct.id, formData);
      }

      Alert.alert('Uğurlu', isNew ? 'Məhsul yaradıldı' : 'Məhsul yeniləndi');
      onSave?.();
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.details?.[0]?.message
        || err.response?.data?.error
        || 'Xəta baş verdi';
      Alert.alert('Xəta', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      {/* Şəkil */}
      <TouchableOpacity style={s.imageBox} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.productImage} />
        ) : (
          <View style={s.imagePlaceholder}>
            <Text style={s.imagePlaceholderText}>📷 Şəkil seçin</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={s.formSection}>
        {/* Ad */}
        <Field label="Məhsulun adı *" error={errors.name}>
          <TextInput
            style={[s.input, errors.name && s.inputError]}
            value={form.name}
            onChangeText={v => setForm(f => ({...f, name: v}))}
            placeholder="Məhsul adı"
          />
        </Field>

        {/* Təsvir */}
        <Field label="Təsvir">
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            value={form.description}
            onChangeText={v => setForm(f => ({...f, description: v}))}
            placeholder="Qısa açıqlama..."
            multiline
          />
        </Field>

        {/* Qiymət + Stok */}
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Field label="Qiymət (₼) *" error={errors.base_price}>
              <TextInput
                style={[s.input, errors.base_price && s.inputError]}
                value={form.base_price}
                onChangeText={v => setForm(f => ({...f, base_price: v}))}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Başlanğıc stoku" error={errors.stock_qty}>
              <TextInput
                style={[s.input, errors.stock_qty && s.inputError]}
                value={form.stock_qty}
                onChangeText={v => setForm(f => ({...f, stock_qty: v}))}
                keyboardType="number-pad"
                placeholder="0"
              />
            </Field>
          </View>
        </View>

        {/* Seqment */}
        <Field label="Seqment">
          <View style={s.segmentRow}>
            {SEGMENTS.map(seg => (
              <TouchableOpacity
                key={seg}
                style={[s.segBtn, form.segment === seg && s.segBtnActive]}
                onPress={() => setForm(f => ({...f, segment: seg}))}
              >
                <Text style={[s.segBtnText, form.segment === seg && s.segBtnActiveText]}>
                  {seg === 'simple' ? 'Sadə' : seg === 'fast' ? 'Fast' : 'Premium'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Kateqoriya */}
        {categories.length > 0 && (
          <Field label="Kateqoriya">
            <View style={s.categoryRow}>
              <TouchableOpacity
                style={[s.catBtn, !form.category_id && s.catBtnActive]}
                onPress={() => setForm(f => ({...f, category_id: null}))}
              >
                <Text style={[s.catBtnText, !form.category_id && s.catBtnActiveText]}>Yoxdur</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.catBtn, form.category_id === cat.id && s.catBtnActive]}
                  onPress={() => setForm(f => ({...f, category_id: cat.id}))}
                >
                  <Text style={[s.catBtnText, form.category_id === cat.id && s.catBtnActiveText]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
        )}

        {/* Aktiv status */}
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Satışda göstər</Text>
          <Switch
            value={form.is_available}
            onValueChange={v => setForm(f => ({...f, is_available: v}))}
            trackColor={{ true: '#FF6B35' }}
          />
        </View>

        {/* İnqredientlər */}
        <Field label="İnqredientlər">
          <View style={s.ingredientGrid}>
            {allIngredients.map(ing => {
              const selected = ingredients.find(i => i.ingredient_id === ing.id);
              return (
                <View key={ing.id}>
                  <TouchableOpacity
                    style={[s.ingBtn, selected && s.ingBtnSelected]}
                    onPress={() => toggleIngredient(ing)}
                  >
                    <Text style={[s.ingBtnText, selected && s.ingBtnSelectedText]}>
                      {ing.name}
                    </Text>
                  </TouchableOpacity>
                  {selected && (
                    <TextInput
                      style={s.ingQtyInput}
                      value={selected.quantity}
                      onChangeText={v => updateIngredientQty(ing.id, v)}
                      keyboardType="decimal-pad"
                      placeholder={`Miqdar (${ing.unit})`}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </Field>
      </View>

      {/* Saxla düyməsi */}
      <TouchableOpacity
        style={[s.saveBtn, loading && { opacity: .6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.saveBtnText}>{isNew ? 'Məhsul Yarat' : 'Dəyişiklikləri Saxla'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, error, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      {children}
      {error && <Text style={s.errorText}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA' },
  imageBox:    { width: '100%', height: 200 },
  productImage:{ width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#E9ECEF',
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderText: { fontSize: 16, color: '#6C757D' },
  formSection: { padding: 16 },
  label:       { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 5 },
  input:       { borderWidth: 1.5, borderColor: '#DEE2E6', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#fff' },
  inputError:  { borderColor: '#E63946' },
  errorText:   { color: '#E63946', fontSize: 12, marginTop: 3 },
  row:         { flexDirection: 'row', gap: 12 },
  segmentRow:  { flexDirection: 'row', gap: 8 },
  segBtn:      { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#DEE2E6', alignItems: 'center', backgroundColor: '#fff' },
  segBtnActive:{ borderColor: '#FF6B35', backgroundColor: '#FF6B3511' },
  segBtnText:  { fontSize: 13, fontWeight: '600', color: '#6C757D' },
  segBtnActiveText: { color: '#FF6B35' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#DEE2E6', backgroundColor: '#fff' },
  catBtnActive:{ borderColor: '#4361EE', backgroundColor: '#4361EE11' },
  catBtnText:  { fontSize: 12, fontWeight: '600', color: '#6C757D' },
  catBtnActiveText: { color: '#4361EE' },
  switchRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 14 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#212529' },
  ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#DEE2E6', backgroundColor: '#fff' },
  ingBtnSelected: { borderColor: '#2DC653', backgroundColor: '#2DC65311' },
  ingBtnText:  { fontSize: 12, fontWeight: '600', color: '#6C757D' },
  ingBtnSelectedText: { color: '#1A8A3A' },
  ingQtyInput: { borderWidth: 1, borderColor: '#DEE2E6', borderRadius: 6, padding: 6, fontSize: 12, marginTop: 4, backgroundColor: '#fff' },
  saveBtn:     { margin: 16, backgroundColor: '#FF6B35', borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
