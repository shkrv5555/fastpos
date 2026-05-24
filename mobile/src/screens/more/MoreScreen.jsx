import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../../store/slices/authSlice';

const MENU_SECTIONS = [
  {
    title: 'Analitika',
    items: [
      { label: '📈 Satış Analitikası',    screen: 'Analytics',    desc: 'Həftəlik/aylıq qrafiklər' },
      { label: '📦 Stok Tarixçəsi',       screen: 'StockHistory', desc: 'Bütün stok daxiletmələr' },
    ],
  },
  {
    title: 'İdarəetmə',
    items: [
      { label: '✏️ Redaktə Sorğuları',  screen: 'EditRequests', desc: 'İşçilərin icazə sorğuları' },
    ],
  },
  {
    title: 'AI Köməkçi',
    items: [
      { label: '🤖 AI Chatbot',         screen: 'Chatbot',      desc: 'Biznes suallarını soruşun' },
    ],
  },
];

export default function MoreScreen() {
  const dispatch   = useDispatch();
  const navigation = useNavigation();
  const user       = useSelector(s => s.auth.user);

  function handleLogout() {
    Alert.alert(
      'Çıxış',
      'Hesabdan çıxmaq istəyirsiniz?',
      [
        { text: 'Xeyr', style: 'cancel' },
        { text: 'Bəli', style: 'destructive', onPress: () => dispatch(logout()) },
      ]
    );
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Profil kartı */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <View>
          <Text style={s.userName}>{user?.name || 'Sahib'}</Text>
          <Text style={s.userRole}>Müəssisə sahibi</Text>
        </View>
      </View>

      {/* Menyü bölmələri */}
      {MENU_SECTIONS.map(section => (
        <View key={section.title} style={s.section}>
          <Text style={s.sectionTitle}>{section.title}</Text>
          {section.items.map(item => (
            <TouchableOpacity
              key={item.screen}
              style={s.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuDesc}>{item.desc}</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Çıxış */}
      <View style={s.section}>
        <TouchableOpacity style={[s.menuItem, s.logoutItem]} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={[s.menuLabel, { color: '#E63946' }]}>🚪 Çıxış</Text>
          <Text style={s.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA' },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: .06, shadowRadius: 8,
  },
  avatar:      {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FF6B35',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText:  { color: '#fff', fontSize: 22, fontWeight: '800' },
  userName:    { fontSize: 17, fontWeight: '700', color: '#212529' },
  userRole:    { fontSize: 12, color: '#6C757D', marginTop: 2 },
  section:     { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle:{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 6, paddingHorizontal: 4 },
  menuItem:    {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6,
  },
  logoutItem:  { },
  menuLabel:   { fontSize: 15, fontWeight: '600', color: '#212529' },
  menuDesc:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  arrow:       { fontSize: 20, color: '#CED4DA', marginLeft: 8 },
});
