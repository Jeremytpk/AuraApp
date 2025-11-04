
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

import AuraLogo from '../assets/AuraLogo.png';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.logo}>🌸</Text>
        <Text style={styles.title}>Welcome to Aura</Text>
        <Text style={styles.subtitle}>Your friendly AI companion for deep chats, support, and fun!</Text>
      </View>
      <Image
        source={AuraLogo}
        style={styles.heroImage}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate('Chat')}>
        <Text style={styles.chatButtonText}>Start Chatting 💬</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8', // warm pinkish background
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 160,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D72660', // deep pink
    marginBottom: 6,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#A78682', // soft brown
    textAlign: 'center',
    marginBottom: 8,
  },
  heroImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: 32,
    borderWidth: 4,
    borderColor: '#FFD6E0',
    backgroundColor: '#FFE3ED',
  },
  chatButton: {
    backgroundColor: '#D72660',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 32,
    shadowColor: '#D72660',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 150,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
