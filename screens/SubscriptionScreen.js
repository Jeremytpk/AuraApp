import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// --- Professional UI Color Palette ---
const COLORS = {
  background: '#FFFFFF',
  card: '#F9FAFB',
  primary: '#D72660',
  primaryLight: '#FEF2F6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  accent: '#10B981', // For the 'Most Popular' tag
  border: '#E5E7EB',
};

// --- Plan Data (for easier scaling and maintenance) ---
const plans = [
  {
    id: 'free',
    title: 'Free',
    price: '$0',
    priceDetails: 'Forever',
    features: ['50 messages per day', 'Standard response speed', 'No photo sharing'],
    isPopular: false,
  },
  {
    id: 'Queen',
    title: 'Queen',
    price: '$4.99',
    priceDetails: 'per week',
    features: ['Unlimited messages', 'Priority response speed', 'Photo sharing', 'Full conversation history', 'Access all new features'],
    isPopular: true,
  },
  {
    id: 'Princess',
    title: 'Princess',
    price: '$1.99',
    priceDetails: 'per week',
    features: ['150 messages per day', 'Standard response speed', 'Photo sharing enabled'],
    isPopular: false,
  },
];

export default function SubscriptionScreen({ navigation }) {
  const [selectedPlanId, setSelectedPlanId] = useState('pro'); // Default to the popular plan
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [trialDaysLeft, setTrialDaysLeft] = useState(null);

  // --- Plan Features & Limits ---
  const planFeatures = {
    free: { limit: 50, photo: false, history: false },
    Princess: { limit: 150, photo: true, history: false },
    Queen: { limit: Infinity, photo: true, history: true },
    Trial: { limit: Infinity, photo: true, history: true },
    Coins: { limit: 9999, photo: true, history: true },
  };
  // --- Confirmation Modal ---
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const handlePlanSelect = (planId) => {
    setPendingPlan(planId);
    setShowConfirm(true);
  };
  const confirmPlan = async () => {
    setShowConfirm(false);
    // Capitalize plan name to match ChatScreen (Free, Princess, Queen)
    const planName = pendingPlan.charAt(0).toUpperCase() + pendingPlan.slice(1);
    setCurrentPlan(planName);
    await AsyncStorage.setItem('aura_plan', planName);
    if (pendingPlan === 'Trial') {
      const now = Date.now();
      await AsyncStorage.setItem('aura_trial_start', now.toString());
    } else {
      await AsyncStorage.setItem('aura_trial_start', '');
    }
    navigation.goBack && navigation.goBack();
  };

  useEffect(() => {
    (async () => {
      const trialStart = await AsyncStorage.getItem('aura_trial_start');
      if (trialStart) {
        const start = parseInt(trialStart, 10);
        const now = Date.now();
        const days = Math.max(0, 5 - Math.floor((now - start) / (1000 * 60 * 60 * 24)));
        setTrialDaysLeft(days);
        if (days === 0) {
          setCurrentPlan('Free');
          await AsyncStorage.setItem('aura_trial_start', '');
        } else {
          setCurrentPlan('Trial');
        }
      }
    })();
  }, []);

  const renderPlan = (plan) => {
    const isSelected = selectedPlanId === plan.id;
    return (
      <TouchableOpacity
        key={plan.id}
        style={[styles.planCard, isSelected && styles.selectedCard]}
        onPress={() => handlePlanSelect(plan.id)}
      >
        {plan.isPopular && <View style={styles.popularTag}><Text style={styles.popularTagText}>Most Popular</Text></View>}
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>
              {plan.id === 'Queen' && '👑 '}{plan.price}
            </Text>
            <Text style={styles.planPriceDetails}>{plan.priceDetails}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Feather name="check-circle" size={16} color={COLORS.primary} style={styles.featureIcon} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  // Show trial banner if user is in trial and has days left
  const showTrialBanner = currentPlan === 'Trial' && trialDaysLeft && trialDaysLeft > 0;

  return (
    <SafeAreaView style={styles.container}>
      {showTrialBanner && (
        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8, margin: 12, alignSelf: 'center' }}>
          <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 15 }}>
            Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left of full features!
          </Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Upgrade Your Experience</Text>
        <Text style={styles.subHeader}>Unlock premium features and enjoy unlimited conversations with Aura.</Text>
        
        {plans.map(renderPlan)}

        {/* --- Pay-as-you-go Option --- */}
        <View style={styles.altOptionCard}>
            <View>
                <Text style={styles.altOptionTitle}>Just need a few more?</Text>
                <Text style={styles.altOptionDesc}>Buy coins for extra messages.</Text>
            </View>
            <TouchableOpacity style={styles.buyCoinsButton} onPress={() => {/* TODO: implement coin purchase */}}>
                <Text style={styles.buyCoinsButtonText}>Buy Coins</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* --- Sticky Footer for Actions --- */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={confirmPlan}>
          <Text style={styles.primaryButtonText}>{pendingPlan === 'Trial' ? 'Start 5-Day Free Trial' : `Continue with ${plans.find(p => p.id === pendingPlan)?.title || plans.find(p => p.id === selectedPlanId)?.title} Plan`}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack && navigation.goBack()}>
          <Text style={styles.secondaryActionText}>Not now</Text>
        </TouchableOpacity>
      </View>
      {/* --- Plan Confirmation Modal --- */}
      <Modal
        visible={showConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 28, minWidth: 280, alignItems: 'center' }}>
            <Feather name="check-circle" size={40} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Confirm {pendingPlan === 'Trial' ? '5-Day Free Trial' : plans.find(p => p.id === pendingPlan)?.title} Plan?</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 15, marginBottom: 24, textAlign: 'center' }}>Are you sure you want to switch to this plan? Features and limits will update immediately.</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: COLORS.primary, marginRight: 8 }]}
                onPress={confirmPlan}
              >
                <Text style={styles.closeModalText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: COLORS.border, marginLeft: 8 }]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={[styles.closeModalText, { color: COLORS.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 24, paddingBottom: 150 }, // Padding bottom to clear footer
  header: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 16, textAlign: 'center' },
  subHeader: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32, maxWidth: 300, alignSelf: 'center' },
  planCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: COLORS.border },
  selectedCard: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  popularTag: { position: 'absolute', top: -12, right: 20, backgroundColor: COLORS.accent, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, },
  popularTagText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  priceContainer: { alignItems: 'flex-end' },
  planPrice: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary },
  planPriceDetails: { fontSize: 14, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  featuresList: { marginTop: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon: { marginRight: 12 },
  featureText: { fontSize: 15, color: COLORS.textSecondary, flex: 1 },
  altOptionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 16 },
  altOptionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  altOptionDesc: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  buyCoinsButton: { backgroundColor: COLORS.primaryLight, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  buyCoinsButtonText: { color: COLORS.primary, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 10, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center', },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, width: '100%', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryActionText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 15, marginTop: 16 },
  closeModalBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeModalText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});