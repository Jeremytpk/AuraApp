
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import CountryPicker from 'react-native-country-picker-modal';

// Colors from logo_Aura.png (example palette, adjust as needed)
const LOGO_COLORS = [
  '#D72660', // deep pink
  '#FFB7B2', // light pink
  '#A78682', // soft brown
  '#FFE3ED', // soft pink
  '#FFF5F8', // very light pink
  '#6A5AE0', // purple
];

const ZODIAC_SIGNS = [
  '', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export default function OnboardingScreen({ navigation }) {
  const [personality, setPersonality] = useState('sassy');
  const [race, setRace] = useState('');
  const [age, setAge] = useState('');
  const [religion, setReligion] = useState('');
  const [religionDepth, setReligionDepth] = useState(0);
  const [zodiac, setZodiac] = useState('');
  const [country, setCountry] = useState(null);
  const [countryCode, setCountryCode] = useState('US');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#FFF' }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%' }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#D72660', marginBottom: 8, letterSpacing: 1, textAlign: 'center' }}>Welcome to Aura!</Text>
          <Text style={{ fontSize: 16, color: '#6A5AE0', marginBottom: 24, textAlign: 'center' }}>Let's get to know you so Aura can be the best friend for you.</Text>

          <Text style={{ fontSize: 16, color: '#A78682', marginBottom: 4, marginTop: 16, fontWeight: '600' }}>Choose Aura's Personality</Text>
          <View style={{ borderWidth: 1, borderColor: '#FFD6E0', borderRadius: 16, backgroundColor: '#FFF5F8', marginBottom: 4, overflow: 'hidden' }}>
            <Picker
              selectedValue={personality}
              style={{ width: '100%', height: 54, color: '#D72660' }}
              onValueChange={setPersonality}
            >
              <Picker.Item label="Sassy" value="sassy" />
              <Picker.Item label="Friendly" value="friendly" />
              <Picker.Item label="Professional" value="professional" />
            </Picker>
          </View>

          <Text style={{ fontSize: 16, color: '#A78682', marginBottom: 4, marginTop: 16, fontWeight: '600' }}>Race / Ethnicity</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#FFD6E0', borderRadius: 16, backgroundColor: '#FFF5F8', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, marginBottom: 8, color: '#222' }}
            value={race}
            onChangeText={setRace}
            placeholder="e.g. Black, Asian, Hispanic, etc."
          />

          <Text style={{ fontSize: 16, color: '#A78682', marginBottom: 4, marginTop: 16, fontWeight: '600' }}>Age</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#FFD6E0', borderRadius: 16, backgroundColor: '#FFF5F8', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, marginBottom: 8, color: '#222' }}
            value={age}
            onChangeText={setAge}
            placeholder="Enter your age"
            keyboardType="numeric"
          />

          <Text style={{ fontSize: 16, color: '#A78682', marginBottom: 4, marginTop: 16, fontWeight: '600' }}>Religion (optional)</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#FFD6E0', borderRadius: 16, backgroundColor: '#FFF5F8', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, marginBottom: 8, color: '#222' }}
            value={religion}
            onChangeText={setReligion}
            placeholder="e.g. Christian, Muslim, None, etc."
          />
          <Text style={{ fontSize: 16, color: '#A78682', marginBottom: 4, marginTop: 16, fontWeight: '600' }}>How deep? (0-10, optional)</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={religionDepth}
            onValueChange={setReligionDepth}
            minimumTrackTintColor="#D72660"
            maximumTrackTintColor="#FFE3ED"
            thumbTintColor="#D72660"
          />
          <Text style={{ fontSize: 16, color: '#D72660', alignSelf: 'flex-end', marginBottom: 8 }}>{religionDepth}</Text>

          <Text style={{ fontSize: 16, color: '#A78682', marginBottom: 4, marginTop: 16, fontWeight: '600' }}>Zodiac Sign (optional)</Text>
          <View style={{ borderWidth: 1, borderColor: '#FFD6E0', borderRadius: 16, backgroundColor: '#FFF5F8', marginBottom: 4, overflow: 'hidden' }}>
            <Picker
              selectedValue={zodiac}
              style={{ width: '100%', height: 54, color: '#D72660' }}
              onValueChange={setZodiac}
            >
              {ZODIAC_SIGNS.map(sign => (
                <Picker.Item key={sign} label={sign || 'Select'} value={sign} />
              ))}
            </Picker>
          </View>

          <Text style={{ fontSize: 16, color: '#A78682', marginBottom: 4, marginTop: 16, fontWeight: '600' }}>Country</Text>
          <TouchableOpacity style={{ borderWidth: 1, borderColor: '#FFD6E0', borderRadius: 16, backgroundColor: '#FFF5F8', paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, marginBottom: 8, color: '#222' }} onPress={() => setShowCountryPicker(true)}>
            <Text style={{ color: country ? '#222' : '#aaa' }}>{country ? country.name : 'Select your country'}</Text>
          </TouchableOpacity>
          <CountryPicker
            visible={showCountryPicker}
            withFilter
            withFlag
            withCountryNameButton
            withAlphaFilter
            withCallingCode={false}
            onSelect={c => {
              setCountry(c);
              setCountryCode(c.cca2);
              setShowCountryPicker(false);
            }}
            onClose={() => setShowCountryPicker(false)}
            countryCode={countryCode}
          />
        {/* Save & Continue Button */}
        <TouchableOpacity
          style={{ backgroundColor: '#D72660', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 40, alignSelf: 'center', marginTop: 32 }}
          onPress={() => {
            // Validate required fields
            if (!personality || !race || !age || !country) {
              alert('Please fill in all required fields.');
              return;
            }
            navigation.replace('OnboardingLoading');
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>Save & Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
  )}