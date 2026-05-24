import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ownerLogin } from '../../store/slices/authSlice';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    dispatch(ownerLogin({ username, password }));
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>FastPOS</Text>
        <Text style={styles.subtitle}>Sahib paneli</Text>

        <TextInput
          style={styles.input}
          placeholder="İstifadəçi adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifrə"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Daxil ol</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', padding: 24 },
  card:      { backgroundColor: '#fff', borderRadius: 16, padding: 28, shadowColor: '#000', shadowOpacity: .1, shadowRadius: 12, elevation: 4 },
  logo:      { fontSize: 32, fontWeight: '800', color: '#FF6B35', textAlign: 'center', marginBottom: 4 },
  subtitle:  { fontSize: 14, color: '#6C757D', textAlign: 'center', marginBottom: 28 },
  input:     { borderWidth: 1.5, borderColor: '#E9ECEF', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 15 },
  error:     { color: '#E63946', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  btn:       { backgroundColor: '#FF6B35', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
