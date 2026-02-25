import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { router, Redirect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.6)',
  input: '#444148',
};

type Category = { id: number; category_name: string };

export default function CreateHappyPauseScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get('/categories')
      .then(res => {
        const cats = res.data || [];
        setCategories(cats);
        if (cats.length && !categoryId) setCategoryId(cats[0].id);
      })
      .catch(() => {
        setCategories([{ id: 1, category_name: 'FITNESS' }, { id: 2, category_name: 'LEISURE' }, { id: 3, category_name: 'SOCIAL' }, { id: 4, category_name: 'MIND' }, { id: 5, category_name: 'SPIRITUAL' }, { id: 6, category_name: 'RELAXATION' }]);
        setCategoryId(1);
      });
  }, []);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [3, 1] });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/activities', {
        category_id: categoryId || 1,
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim() || null,
      });
      const activity = res.data;
      if (imageUri && activity?.id) {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          const res = await fetch(imageUri);
          const blob = await res.blob();
          const ext = blob.type === 'image/jpeg' ? '.jpg' : '.png';
          const file = new File([blob], `${activity.id}${ext}`, { type: blob.type || 'image/png' });
          formData.append('image', file);
        } else {
          formData.append('image', { uri: imageUri, name: `${activity.id}.png`, type: 'image/png' } as any);
        }
        const t = api.getToken();
        try {
          const uploadRes = await fetch(`${api.getBaseUrl()}/activities/${activity.id}/upload`, {
            method: 'POST',
            headers: t ? { Authorization: `Bearer ${t}` } : {},
            body: formData,
          });
          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || `Image upload failed: ${uploadRes.status}`);
          }
        } catch (uploadErr) {
          Alert.alert('Image upload failed', (uploadErr as Error).message);
          setLoading(false);
          return;
        }
      }
      if (makePublic) {
      }
      router.back();
    } catch (e: unknown) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create a HappyPause</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {(categories.length ? categories : [{ id: 1, category_name: 'FITNESS' }, { id: 2, category_name: 'LEISURE' }, { id: 3, category_name: 'SOCIAL' }, { id: 4, category_name: 'MIND' }, { id: 5, category_name: 'SPIRITUAL' }, { id: 6, category_name: 'RELAXATION' }]).map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catBtn, categoryId === c.id && styles.catBtnActive]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text style={[styles.catText, categoryId === c.id && styles.catTextActive]}>{c.category_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>HappyPause Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Activity name"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Additional Info Link</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor={COLORS.textMuted}
          value={url}
          onChangeText={setUrl}
          keyboardType="url"
        />

        <Text style={styles.label}>Image</Text>
        {imageUri ? (
          <View style={styles.imagePreviewRow}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
              <Text style={styles.uploadText}>Change image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={styles.uploadText}>Pick image</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.checkRow} onPress={() => setMakePublic(p => !p)}>
          <Text style={styles.checkbox}>{makePublic ? '☑' : '☐'}</Text>
          <Text style={styles.checkLabel}>I want to make this HappyPause public</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkRow} onPress={() => setAgreeTerms(a => !a)}>
          <Text style={styles.checkbox}>{agreeTerms ? '☑' : '☐'}</Text>
          <Text style={styles.checkLabel}>I agree to the Terms of Service and acknowledge the Privacy Policy.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, (!agreeTerms || loading) && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={!agreeTerms || loading}
        >
          <Text style={styles.submitText}>ADD & SUBMIT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backBtn: { fontSize: 24, color: COLORS.primary },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: COLORS.text },
  scroll: { flex: 1 },
  content: { padding: 24 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase' },
  input: {
    height: 48,
    backgroundColor: COLORS.input,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: { height: 80, paddingTop: 12 },
  catScroll: { marginBottom: 16 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginRight: 8, backgroundColor: COLORS.input },
  catBtnActive: { backgroundColor: COLORS.primary },
  catText: { fontFamily: 'Poppins_400Regular', color: COLORS.text },
  catTextActive: { color: COLORS.bg },
  uploadBtn: { padding: 16, backgroundColor: COLORS.input, borderRadius: 12, marginBottom: 16 },
  uploadText: { color: COLORS.primary },
  imagePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  imagePreview: { width: 80, height: 27, borderRadius: 8, backgroundColor: COLORS.input },
  changeImageBtn: { padding: 12, backgroundColor: COLORS.input, borderRadius: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { fontSize: 18, marginRight: 12, color: COLORS.primary },
  checkLabel: { flex: 1, fontSize: 14, color: COLORS.text },
  submitBtn: { marginTop: 24, padding: 16, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontFamily: 'Poppins_700Bold', color: COLORS.bg },
});
