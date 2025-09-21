import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';

const ConversationScreen = ({ route, navigation }) => {
  const { chatId: initialChatId } = route.params;
  const [chatId, setChatId] = useState(initialChatId);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [currentPersona, setCurrentPersona] = useState('Aura');
  const [sending, setSending] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data();
          setUserProfile(profile);
          const preferredPersona = profile.genderPref?.toLowerCase().includes('man') ? 'Jert' : 'Aura';
          setCurrentPersona(preferredPersona);
        }
      }
    };
    fetchUserProfile();
  }, []);

  // Set up message listener
  useEffect(() => {
    if (chatId) {
      const messagesRef = collection(db, `users/${auth.currentUser.uid}/chats/${chatId}/messages`);
      const q = query(messagesRef, orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(newMessages);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, [chatId]);

  const handleSend = async () => {
    if (inputMessage.trim() === '' || !userProfile) return;

    const userMessage = {
      text: inputMessage.trim(),
      sender: 'user',
      createdAt: new Date(),
    };
    setInputMessage('');
    setSending(true);

    let currentChatId = chatId;
    
    // If it's the first message, create a new chat
    if (!currentChatId) {
      const chatRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/chats`), {
        title: userMessage.text,
        createdAt: new Date(),
      });
      currentChatId = chatRef.id;
      setChatId(currentChatId);
    }

    // Save user message
    await addDoc(collection(db, `users/${auth.currentUser.uid}/chats/${currentChatId}/messages`), userMessage);
    
    // Get AI response
    getAiResponse(userMessage.text, currentChatId);
  };
    
  const getAiResponse = async (latestMessage, currentChatId) => {
    // This function will contain the Gemini API call logic from the old chat screen
    // For now, we'll simulate a response.
    setTimeout(async () => {
        const aiMessage = {
            text: `This is Aura's simulated response to: "${latestMessage}"`,
            sender: 'ai',
            createdAt: new Date(),
        };
        await addDoc(collection(db, `users/${auth.currentUser.uid}/chats/${currentChatId}/messages`), aiMessage);
        setSending(false);
    }, 1500);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={isUser ? styles.userText : styles.aiText}>{item.text}</Text>
      </View>
    );
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={{flex: 1}} size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Feather name="chevron-left" size={28} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{currentPersona}</Text>
            <View style={{width: 28}}/>
        </View>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={90}
        >
            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messageList}
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    placeholder="Share what you're feeling..."
                    placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={sending}>
                    {sending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={20} color="#fff" />}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  messageList: { paddingHorizontal: 16, paddingVertical: 10 },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginVertical: 4,
    maxWidth: '80%',
  },
  aiBubble: {
    backgroundColor: '#e2e8f0',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: '#9333ea', // Aura's purple
    alignSelf: 'flex-end',
  },
  aiText: {
    fontSize: 16,
    color: '#1e293b',
  },
  userText: {
    fontSize: 16,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#9333ea',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConversationScreen;