import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

export default function OnboardingLoadingScreen({ navigation }) {
  const [finished, setFinished] = useState(false);
  const windowHeight = Dimensions.get('window').height;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F8' }}>
      {!finished ? (
        <>
          <Text style={{ fontSize: 28, color: '#D72660', marginBottom: 24, textAlign: 'center', fontWeight: 'bold', letterSpacing: 1 }}>
            Aura is getting to know you…
          </Text>
          <LottieView
            source={require('../assets/aura_orb.json')}
            autoPlay
            loop={false}
            style={{ width: windowHeight * 0.35, height: windowHeight * 0.35, marginBottom: 24 }}
            onAnimationFinish={() => setFinished(true)}
          />
          <Text style={{ color: '#A78682', fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            Please wait while Aura gently saves your information.
          </Text>
        </>
      ) : (
        <View style={{ alignItems: 'center', width: '100%' }}>
          <LottieView
            source={require('../assets/aura_orb.json')}
            autoPlay
            loop={false}
            style={{ width: windowHeight * 0.25, height: windowHeight * 0.25, marginBottom: 16 }}
            progress={1}
          />
          <Text style={{ fontSize: 28, color: '#6A5AE0', marginBottom: 16, textAlign: 'center', fontWeight: 'bold', letterSpacing: 1 }}>
            Thank you for helping me know you!
          </Text>
          <Text style={{ color: '#A78682', fontSize: 18, textAlign: 'center', marginBottom: 32 }}>
            Aura is ready to be your friend.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#D72660', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 48, alignSelf: 'center', shadowColor: '#D72660', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={{ color: '#FFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
