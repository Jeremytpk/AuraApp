import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Professional UI Color Palette ---
const COLORS = {
  background: '#F9FAFB',      // A very light, clean gray
  card: '#FFFFFF',            // Pure white for cards and modals
  primary: '#D72660',         // Your brand's vibrant pink for accents
  textPrimary: '#111827',     // Dark text for high contrast and readability
  textSecondary: '#6B7280',   // Lighter gray for labels and secondary info
  border: '#E5E7EB',          // Subtle border color
  destructive: '#DC2626',      // A clear red for destructive actions like logout
  destructiveBg: '#FEF2F2',   // Light red background for destructive buttons
};

// --- Default User Data ---
const defaultUser = {
  firstName: '',
  lastName: '',
  email: '',
  profilePhoto: null,
  personality: 'sassy',
};

// --- Reusable Component for List Items ---
const ProfileRow = ({ label, value, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
    <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(defaultUser);
  const [editModal, setEditModal] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ ...defaultUser, ...userDoc.data() });
        }
        setLoading(false);
      } else {
        setLoading(false);
        navigation.replace('Login');
      }
    });
    return unsubscribe;
  }, []);

  const openEdit = (field) => {
    setEditField(field);
    setEditValue(user[field] || '');
    setEditModal(true);
  };

  const saveEdit = async () => {
    setUser({ ...user, [editField]: editValue });
    setEditModal(false);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          [editField]: editValue,
        });
        // Set flag for ChatScreen to notice profile change
        await AsyncStorage.setItem('aura_profile_changed', JSON.stringify({ field: editField, value: editValue, ts: Date.now() }));
      }
    } catch (e) {
      console.log('Failed to update user:', e);
    }
  };

  const changePhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setUser({ ...user, profilePhoto: result.assets[0].uri });
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await updateDoc(doc(db, 'users', currentUser.uid), {
            profilePhoto: result.assets[0].uri,
          });
          // Set flag for ChatScreen to notice profile photo change
          await AsyncStorage.setItem('aura_profile_changed', JSON.stringify({ field: 'profilePhoto', value: result.assets[0].uri, ts: Date.now() }));
        }
      } catch (e) {
        console.log('Failed to update profile photo:', e);
      }
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log('Error signing out:', e);
    }
  setUser(defaultUser);
  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: 18 }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/*<Text style={styles.headerTitle}>Profile & Settings</Text>*/}

        {/* --- Profile Header --- */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarContainer} onPress={changePhoto}>
            {user.profilePhoto ? (
              <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.editIconWrapper}>
              <Feather name="camera" size={16} color={COLORS.card} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* --- Personal Information Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <ProfileRow label="First Name" value={user.firstName} onPress={() => openEdit('firstName')} />
            <View style={styles.divider} />
            <ProfileRow label="Last Name" value={user.lastName} onPress={() => openEdit('lastName')} />
            <View style={styles.divider} />
            <ProfileRow label="Email" value={user.email} onPress={() => openEdit('email')} />
          </View>
        </View>

        {/* --- App Settings Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <ProfileRow
              label="Aura's Personality"
              value={user.personality.charAt(0).toUpperCase() + user.personality.slice(1)}
              onPress={() => navigation.navigate('AuraSettings')} 
            />
          </View>
        </View>
        
        {/* --- Upgrade Button --- */}
        <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('SubscriptionScreen')}>
          <Text style={styles.upgradeButtonText}>Upgrade / Start Free Trial</Text>
        </TouchableOpacity>
        <Text style={styles.trialInfo}>5-day free trial unlocks all features! After trial, choose a plan or buy coins to keep chatting with Aura.</Text>

        {/* --- Logout Button --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- Edit Modal --- */}
      <Modal visible={editModal} animationType="fade" transparent onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editField.charAt(0).toUpperCase() + editField.slice(1)}</Text>
            <TextInput
              style={styles.input}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus
              placeholder={`Enter new ${editField}`}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModal(false)}>
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveEdit}>
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- Professional StyleSheet ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 24, },
  profileHeader: { alignItems: 'center', marginBottom: 32, },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFE3ED', justifyContent: 'center', alignItems: 'center' },
  editIconWrapper: { position: 'absolute', bottom: 4, right: 4, backgroundColor: COLORS.primary, padding: 8, borderRadius: 16, borderWidth: 2, borderColor: COLORS.card },
  userName: { fontSize: 22, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16 },
  userEmail: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, paddingHorizontal: 10, textTransform: 'uppercase' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  rowLabel: { fontSize: 14, color: COLORS.textSecondary },
  rowValue: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '500', marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },
  logoutButton: { backgroundColor: COLORS.destructiveBg, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16, },
  logoutButtonText: { color: COLORS.destructive, fontSize: 16, fontWeight: '600' },
  upgradeButton: {
    backgroundColor: '#6A5AE0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trialInfo: {
    color: '#A78682',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    marginHorizontal: 10,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: COLORS.textPrimary, backgroundColor: '#F9FAFB', marginBottom: 24, },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelButton: { backgroundColor: COLORS.border, marginRight: 8 },
  cancelButtonText: { color: COLORS.textSecondary },
  saveButton: { backgroundColor: COLORS.primary, marginLeft: 8 },
  saveButtonText: { color: COLORS.card },
  modalButtonText: { fontSize: 16, fontWeight: '600' },
});