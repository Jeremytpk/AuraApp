import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Dummy user data for demonstration
const dummyUsers = [
  { id: '1', name: 'Jane Doe', email: 'jane@email.com', plan: 'Free' },
  { id: '2', name: 'Alice Smith', email: 'alice@email.com', plan: 'Princess' },
  { id: '3', name: 'Bob Lee', email: 'bob@email.com', plan: 'Queen' },
];

const plans = ['Free', 'Princess', 'Queen'];

export default function AdminScreen({ navigation }) {
  const [users, setUsers] = useState(dummyUsers);

  const switchPlan = (userId, newPlan) => {
    setUsers(users => users.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    // TODO: Update plan in backend (Firestore, etc.)
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
      <Text style={styles.userPlan}>Current Plan: <Text style={{ fontWeight: 'bold' }}>{item.plan}</Text></Text>
      <View style={styles.planRow}>
        {plans.map(plan => (
          <TouchableOpacity
            key={plan}
            style={[styles.planBtn, item.plan === plan && styles.selectedPlanBtn]}
            onPress={() => switchPlan(item.id, plan)}
            disabled={item.plan === plan}
          >
            <Text style={[styles.planBtnText, item.plan === plan && styles.selectedPlanBtnText]}>{plan}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 0 }}>
        <Text style={styles.header}>Admin Panel</Text>
        <TouchableOpacity
          style={{ position: 'absolute', right: 24 }}
          onPress={() => navigation.navigate('Profile')}
        >
          <Feather name="settings" size={28} color="#D72660" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>Manage users and switch their plans</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#D72660', marginTop: 24, textAlign: 'center' },
  subHeader: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 18 },
  userCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 18, shadowColor: '#D72660', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  userName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  userEmail: { fontSize: 15, color: '#6B7280', marginBottom: 6 },
  userPlan: { fontSize: 15, color: '#D72660', marginBottom: 10 },
  planRow: { flexDirection: 'row', marginTop: 4 },
  planBtn: { backgroundColor: '#F9FAFB', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderWidth: 1, borderColor: '#D72660' },
  planBtnText: { color: '#D72660', fontWeight: '600' },
  selectedPlanBtn: { backgroundColor: '#D72660' },
  selectedPlanBtnText: { color: '#fff' },
});
