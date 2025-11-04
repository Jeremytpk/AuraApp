import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TransitScreen({ navigation }) {
  useEffect(() => {
    const checkUser = async () => {
      // Replace this with your real auth logic
      // Example: get user object from AsyncStorage or Firebase
      const userStr = await AsyncStorage.getItem('user');
      let isAdmin = false;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          isAdmin = !!user.isAdmin;
        } catch {}
      }
      navigation.reset({
        index: 0,
        routes: [{ name: isAdmin ? 'Admin' : 'Chat' }],
      });
    };
    checkUser();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#D72660" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F8' },
});
