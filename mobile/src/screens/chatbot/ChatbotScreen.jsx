import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { aiAPI } from '../../api/endpoints';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Salam! Biznesiniz haqqında sual verin. Məsələn: "Bu həftə ən çox nə satıldı?" və ya "Stokda az qalan məhsullar hansilar?"' },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0), userMsg];
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Yalnız user/assistant növbəsini göndər (sistem mesajı backend-də qurulur)
      const apiMessages = newMessages.filter(m => m.role !== 'system');
      const { data } = await aiAPI.chat(apiMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Xəta baş verdi. Yenidən cəhd edin.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            {item.role === 'assistant' && (
              <Text style={styles.aiLabel}>🤖 AI</Text>
            )}
            <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>
              {item.content}
            </Text>
          </View>
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />

      {loading && (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color="#FF6B35" />
          <Text style={styles.typingText}>Cavab yazılır...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Sual verin..."
          multiline
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading || !input.trim()}>
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F9FA' },
  list:        { padding: 16, gap: 12 },
  bubble:      { maxWidth: '85%', borderRadius: 14, padding: 12 },
  userBubble:  { backgroundColor: '#FF6B35', alignSelf: 'flex-end' },
  aiBubble:    { backgroundColor: '#fff', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E9ECEF' },
  aiLabel:     { fontSize: 11, color: '#6C757D', marginBottom: 4 },
  bubbleText:  { fontSize: 14, color: '#212529', lineHeight: 20 },
  userText:    { color: '#fff' },
  typingRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, paddingHorizontal: 16 },
  typingText:  { fontSize: 12, color: '#6C757D' },
  inputRow:    { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#E9ECEF', backgroundColor: '#fff' },
  input:       { flex: 1, borderWidth: 1.5, borderColor: '#E9ECEF', borderRadius: 12, padding: 10, fontSize: 14, maxHeight: 100 },
  sendBtn:     { width: 42, height: 42, backgroundColor: '#FF6B35', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  sendText:    { color: '#fff', fontSize: 18, fontWeight: '700' },
});
