import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DeepThinkingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deep Thinking Mode</Text>
      <Text>Premium users can access deeper conversations here.</Text>
      {/* Add deep thinking chat logic here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
