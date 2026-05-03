import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { receiptsApi } from '../../services/api';
import Button from '../../components/Button';

export default function UploadScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('choice'); // 'choice' | 'camera' | 'uploading' | 'done'
  const [receiptId, setReceiptId] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const cameraRef = useRef(null);

  async function takePicture() {
    if (!cameraRef.current) return;
    setMode('uploading');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      await uploadImage(photo.uri);
    } catch {
      setMode('camera');
      Alert.alert('Hata', 'Fotoğraf çekilemedi');
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    setMode('uploading');
    await uploadImage(result.assets[0].uri);
  }

  async function uploadImage(uri) {
    try {
      const res = await receiptsApi.upload(uri);
      setReceiptId(res.receipt_id);
      setUploadResult(res);
      setMode('done');
    } catch (err) {
      setMode('choice');
      Alert.alert('Yükleme Başarısız', err.message);
    }
  }

  if (mode === 'uploading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.uploadingText}>Fiş yükleniyor...</Text>
        <Text style={styles.uploadingHint}>Arka planda işlenecek</Text>
      </View>
    );
  }

  if (mode === 'done') {
    return (
      <ScrollView contentContainerStyle={styles.doneContainer}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>Fiş Yüklendi!</Text>
        <Text style={styles.doneSubtitle}>
          Tahmini işlem süresi: ~{uploadResult?.estimated_seconds || 8} saniye
        </Text>
        <View style={styles.doneActions}>
          <Button
            title="Fişi Takip Et"
            onPress={() => {
              setMode('choice');
              navigation.navigate('ReceiptDetail', { id: receiptId, polling: true });
            }}
          />
          <Button
            title="Yeni Fiş Ekle"
            onPress={() => setMode('choice')}
            variant="secondary"
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    );
  }

  if (mode === 'camera') {
    if (!permission?.granted) {
      return (
        <View style={styles.centered}>
          <Text style={styles.permText}>Kamera izni gerekli</Text>
          <Button title="İzin Ver" onPress={requestPermission} style={{ marginTop: 16, width: 200 }} />
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraGuide} />
            <Text style={styles.cameraHint}>Fişi çerçeve içine al</Text>
          </View>
        </CameraView>
        <View style={styles.cameraControls}>
          <TouchableOpacity onPress={() => setMode('choice')} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <View style={{ width: 60 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.choiceContainer}>
      <Text style={styles.choiceTitle}>Fiş Ekle</Text>
      <Text style={styles.choiceSubtitle}>
        GİB QR kodu önce okunur. Yoksa OCR devreye girer.
      </Text>

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => {
            if (!permission?.granted) requestPermission().then(() => setMode('camera'));
            else setMode('camera');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.optionIcon}>📷</Text>
          <Text style={styles.optionTitle}>Kamerayla Çek</Text>
          <Text style={styles.optionHint}>Fişi doğrudan çek</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={pickFromGallery} activeOpacity={0.8}>
          <Text style={styles.optionIcon}>🖼️</Text>
          <Text style={styles.optionTitle}>Galeriden Seç</Text>
          <Text style={styles.optionHint}>Daha önce çektiğin fotoğraf</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  uploadingText: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 20 },
  uploadingHint: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  doneContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F8FAFC' },
  doneIcon: { fontSize: 64 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 20 },
  doneSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
  doneActions: { width: '100%', marginTop: 32 },
  permText: { fontSize: 16, color: '#374151' },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraGuide: {
    width: 280, height: 400, borderWidth: 2, borderColor: '#4F46E5',
    borderRadius: 12, backgroundColor: 'transparent',
  },
  cameraHint: { color: '#fff', marginTop: 16, fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  cameraControls: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  cancelBtn: { width: 60, alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 16 },
  shutterBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  choiceContainer: { flex: 1, backgroundColor: '#F8FAFC', padding: 24, paddingTop: 40 },
  choiceTitle: { fontSize: 26, fontWeight: '800', color: '#111827' },
  choiceSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 20 },
  options: { marginTop: 32, gap: 16 },
  optionCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  optionIcon: { fontSize: 40 },
  optionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 12 },
  optionHint: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
