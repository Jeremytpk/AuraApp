import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Reusable Component for clear section titles ---
const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeaderText}>{title}</Text>
);

// --- Reusable Component for each settings item ---
const SettingsItem = ({ label, sublabel, icon, onPress, isDestructive = false }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.itemLeft}>
        <Icon 
            name={icon} 
            size={22} 
            style={[styles.itemIcon, isDestructive && styles.destructiveText]} 
        />
        <View>
            <Text style={[styles.itemLabel, isDestructive && styles.destructiveText]}>{label}</Text>
            {sublabel && <Text style={styles.itemSublabel}>{sublabel}</Text>}
        </View>
    </View>
    <Icon name="chevron-forward-outline" size={20} style={styles.itemChevron} />
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: () => {
            signOut(auth).catch((error) => {
                console.error("Logout Error:", error);
                Alert.alert("Error", "An error occurred while logging out.");
            });
            // The onAuthStateChanged listener in your main App file will handle navigation.
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
       <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevron-back-outline" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{width: 40}} /> {/* Spacer for balance */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
            <SettingsItem 
                icon="key-outline"
                label="Account & Login" 
                sublabel="Update display name, email, or password" 
                onPress={() => navigation.navigate('Account')} 
            />
            <SettingsItem 
                icon="person-circle-outline"
                label="My Profile & Vibe" 
                sublabel="Update your info and companion's behavior" 
                onPress={() => navigation.navigate('ProfileSetup')} 
            />
        </View>

        <SectionHeader title="LEGAL" />
        <View style={styles.section}>
            <SettingsItem 
                icon="shield-checkmark-outline"
                label="Privacy Policy" 
                sublabel="How we protect your data" 
                onPress={() => Alert.alert("Privacy Policy", "This is where the privacy policy details would be displayed.")}
            />
            <SettingsItem 
                icon="document-text-outline"
                label="Terms of Service" 
                sublabel="The rules of our community" 
                onPress={() => Alert.alert("Terms of Service", "This is where the terms of service details would be displayed.")} 
            />
        </View>
        
        <SectionHeader title="GENERAL" />
        <View style={styles.section}>
            <SettingsItem 
                icon="log-out-outline"
                label="Logout"
                onPress={handleLogout}
                isDestructive={true}
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3.0,
    elevation: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    color: '#334155',
    marginRight: 16,
  },
  itemLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  itemSublabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  itemChevron: {
    color: '#cbd5e1',
  },
  destructiveText: {
    color: '#ef4444',
  },
});

export default SettingsScreen;