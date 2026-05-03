import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (name.trim().length < 2) e.name = 'En az 2 karakter girin';
    if (!email.includes('@')) e.email = 'Geçerli bir e-posta girin';
    if (password.length < 8) e.password = 'Şifre en az 8 karakter olmalı';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      Alert.alert('Kayıt Başarısız', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>Ücretsiz, reklamsız, açık kaynak</Text>
        </View>

        <View style={styles.form}>
          <Input label="Ad Soyad" value={name} onChangeText={setName} placeholder="Ahmet Yılmaz" error={errors.name} />
          <Input
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            placeholder="En az 8 karakter"
            secureTextEntry
            error={errors.password}
          />
          <Button title="Kayıt Ol" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />
          <Button
            title="Zaten hesabın var mı? Giriş yap"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F8FAFC' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#4F46E5' },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 8 },
  form: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
});
