import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import OnboardingLoadingScreen from './screens/OnboardingLoadingScreen';
import ProfileScreen from './screens/ProfileScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import DeepThinkingScreen from './screens/DeepThinkingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import AuraSettings from './screens/AuraSettings';
import TransitScreen from './screens/TransitScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  useEffect(() => {
    const checkLogin = async () => {
      // You can replace this with your real auth logic
      const loggedIn = await AsyncStorage.getItem('loggedIn');
      setInitialRoute(loggedIn === 'true' ? 'Home' : 'Login');
    };
    checkLogin();
  }, []);

  if (!initialRoute) {
    return null; // or a splash/loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{headerShown: false}} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{headerShown: false}} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{headerShown: false}} />
        <Stack.Screen name="Home" component={HomeScreen} options={{headerShown: false}} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{headerShown: false}}/>
        <Stack.Screen name="OnboardingLoading" component={OnboardingLoadingScreen} options={{headerShown: false}} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{headerShown: false, title: 'Aura', headerTitleAlign: 'center'}} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{headerShown: true, title: 'Profile & Settings', headerTitleAlign: 'center'}} />
        <Stack.Screen name="AuraSettings" component={AuraSettings}  />
        <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} options={{headerShown: true, title: 'Upgrade', headerTitleAlign: 'center'}}/>
        <Stack.Screen name="DeepThinking" component={DeepThinkingScreen} />
        <Stack.Screen name="TransitScreen" component={TransitScreen} options={{headerShown: false}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
