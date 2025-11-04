import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import AuraLogo from '../assets/AuraLogo.png';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const db = getFirestore();

export default function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F8', paddingHorizontal: 24 }}>
      <View style={{
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFE3ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
        shadowColor: '#D72660',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
      }}>
        <Image source={AuraLogo} style={{ width: 80, height: 80, borderRadius: 40 }} resizeMode="contain" />
      </View>
  <Text style={{ fontSize: 34, color: '#D72660', fontWeight: '800', marginBottom: 8, letterSpacing: 1.2, fontFamily: 'System', textShadowColor: '#FFE3ED', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 6 }}>Sign Up for Aura</Text>
  <Text style={{ color: '#A78682', fontSize: 17, marginBottom: 28, textAlign: 'center', fontWeight: '600', letterSpacing: 0.7, fontFamily: 'System' }}>Create your account to start chatting</Text>
      <TextInput
  style={{ width: '100%', maxWidth: 320, borderWidth: 1.5, borderColor: '#D72660', borderRadius: 18, backgroundColor: '#FFF', padding: 16, fontSize: 17, marginBottom: 14, color: '#222', shadowColor: '#D72660', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, fontFamily: 'System', fontWeight: '500' }}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        placeholderTextColor="#A78682"
      />
      <TextInput
  style={{ width: '100%', maxWidth: 320, borderWidth: 1.5, borderColor: '#D72660', borderRadius: 18, backgroundColor: '#FFF', padding: 16, fontSize: 17, marginBottom: 14, color: '#222', shadowColor: '#D72660', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, fontFamily: 'System', fontWeight: '500' }}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        placeholderTextColor="#A78682"
      />
      <TextInput
  style={{ width: '100%', maxWidth: 320, borderWidth: 1.5, borderColor: '#D72660', borderRadius: 18, backgroundColor: '#FFF', padding: 16, fontSize: 17, marginBottom: 14, color: '#222', shadowColor: '#D72660', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, fontFamily: 'System', fontWeight: '500' }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor="#A78682"
      />
      <View style={{ width: '100%', maxWidth: 320, marginBottom: 28, position: 'relative' }}>
        <TextInput
          style={{ width: '100%', borderWidth: 1.5, borderColor: '#D72660', borderRadius: 18, backgroundColor: '#FFF', padding: 16, fontSize: 17, color: '#222', shadowColor: '#D72660', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, fontFamily: 'System', fontWeight: '500', paddingRight: 48 }}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#A78682"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(v => !v)}
          style={{ position: 'absolute', right: 12, top: 0, height: '100%', justifyContent: 'center', paddingHorizontal: 8 }}
        >
          <Text style={{ color: '#A78682', fontSize: 15, fontWeight: '600' }}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#D72660', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 40, marginBottom: 18, width: '100%', maxWidth: 320, alignItems: 'center', shadowColor: '#D72660', shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 }}
        onPress={async () => {
          try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;
            // Add user to Firestore users collection
            await setDoc(doc(db, 'users', userId), {
              firstName,
              lastName,
              email,
              createdAt: new Date().toISOString(),
            });
            await AsyncStorage.setItem('onboardingComplete', 'false');
            navigation.replace('Onboarding');
          } catch (e) {
            alert(e.message || 'Sign up failed');
          }
        }}
      >
  <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700', letterSpacing: 1.1, fontFamily: 'System', textShadowColor: '#A78682', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.replace('Login')}>
  <Text style={{ color: '#6A5AE0', fontSize: 17, marginTop: 4, fontWeight: '600', letterSpacing: 0.5, fontFamily: 'System' }}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}
