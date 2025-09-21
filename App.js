import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/Login.js';
import SignupScreen from './screens/Signup.js';
import ProfileSetupScreen from './screens/ProfileSetup.js';
import ChatScreen from './screens/Chat.js';
import SettingsScreen from './screens/Settings.js';
import ConversationScreen from './screens/ConversationScreen.js';
import AccountScreen from './screens/Account.js';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false // Hides the header for a cleaner look
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen
  name="ProfileSetup"
  component={ProfileSetupScreen}
  options={{
    headerShown: true,
    title: ''
  }}
/>
        <Stack.Screen
  name="Account"
  component={AccountScreen}
  options={{
    headerShown: false,
    title: ''
  }}
/>
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

