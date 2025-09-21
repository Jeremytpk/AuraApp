import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  FlatList, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  writeBatch, 
  serverTimestamp, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatScreen = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState('Aura');
  const flatListRef = useRef();

  // 1. Fetch User Profile and subscribe to messages on component mount
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigation.replace('Login');
      return;
    }

    const fetchProfile = async () => {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        setUserProfile(profileData);
        const initialPersona = (profileData.genderPref?.toLowerCase() === 'man') ? 'Jert' : 'Aura';
        setPersona(initialPersona);
      } else {
        navigation.replace('ProfileSetup');
      }
    };

    fetchProfile();
    
    const messagesRef = collection(db, "users", currentUser.uid, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedMessages = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            fetchedMessages.push({ 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
            });
        });
        setMessages(fetchedMessages);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [navigation]);

  // 2. Build the dynamic system prompt for the AI
  const buildSystemPrompt = (profile, currentPersona) => {
      let prompt = `You are an AI companion. Your current persona is '${currentPersona}', an empathetic ${currentPersona === 'Jert' ? 'male' : 'female'} friend. You are speaking with a ${profile.userGender}. Your memory is shared between your Aura and Jert personas.`;
      switch (profile.behavior) {
          case 'professional': prompt += ` Your BEHAVIOR MODE is 'Professional'. Your tone is formal and structured. Avoid slang.`; break;
          case 'ghetto': prompt += ` Your BEHAVIOR MODE is 'Ghetto'. Talk like a real, loyal, down-to-earth friend. Use AAVE (like 'sis,' 'spill the tea,' 'periodt') naturally. Your vibe is funny and direct.`; break;
          default: prompt += ` Your BEHAVIOR MODE is 'Standard'. Your tone is warm, empathetic, and friendly.`; break;
      }
      prompt += ` You have counterparts: Aura (female) and Jert (male). Switch persona when asked.`;
      if (profile.religion?.toLowerCase().includes('christ')) prompt += ` The user is Christian; you can gently offer a relevant Bible verse.`;
      prompt += ` Social Rules: 1. If the user vents with insults, show solidarity first. 2. Then, gently ask if they want serious advice. 3. Follow their lead.`;
      return prompt;
  };
  
  // 3. Handle sending user messages
  const handleSend = async () => {
    if (inputMessage.trim() === '' || !userProfile) return;
    const currentUser = auth.currentUser;
    const userMessage = {
        _id: Math.random().toString(),
        text: inputMessage,
        createdAt: serverTimestamp(),
        sender: 'user'
    };
    
    const tempInput = inputMessage;
    setInputMessage('');
    
    const messagesRef = collection(db, "users", currentUser.uid, "messages");
    await addDoc(messagesRef, userMessage);
    
    const lowerMessage = tempInput.toLowerCase();
    let currentPersona = persona;
    if (lowerMessage.includes('jert') && persona !== 'Jert') {
        currentPersona = 'Jert';
        setPersona('Jert');
    } else if (lowerMessage.includes('aura') && persona !== 'Aura') {
        currentPersona = 'Aura';
        setPersona('Aura');
    }

    getAiResponse(currentPersona, tempInput);
  };
  
  // 4. Get AI response from Gemini
  const getAiResponse = async (currentPersona, userText) => {
      // --- CRITICAL SECURITY WARNING ---
      // Do not hardcode your API key. Use environment variables or a secure backend.
      const apiKey = "AIzaSyCMOCHSfMTdJ2gaHr5LPDgGRbS7nSDM8Pk"; 
      
      if (apiKey === "YOUR_GEMINI_API_KEY") {
        console.error("API Key is not set. Please replace 'YOUR_GEMINI_API_KEY'.");
        return;
      }

      setLoading(true);
      const currentUser = auth.currentUser;
      const systemPrompt = buildSystemPrompt(userProfile, currentPersona);
      
      const conversationHistory = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
      }));

      conversationHistory.push({ role: 'user', parts: [{ text: userText }] });

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const payload = {
          contents: conversationHistory,
          systemInstruction: { parts: [{ text: systemPrompt }] },
      };

      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
          const result = await response.json();
          const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (aiText) {
              const aiMessage = {
                  _id: Math.random().toString(),
                  text: aiText,
                  createdAt: serverTimestamp(),
                  sender: 'ai'
              };
              const messagesRef = collection(db, "users", currentUser.uid, "messages");
              await addDoc(messagesRef, aiMessage);
          }
      } catch (error) {
          console.error("AI Response Error:", error);
          const errorMessage = {
              _id: Math.random().toString(),
              text: "I'm having a little trouble connecting. Please try again.",
              createdAt: serverTimestamp(),
              sender: 'ai'
          };
           const messagesRef = collection(db, "users", currentUser.uid, "messages");
           await addDoc(messagesRef, errorMessage);
      } finally {
          setLoading(false);
      }
  };

  // 5. New Chat Functionality (Save & Clear)
  const saveChat = async () => {
    if (messages.length === 0) return;
    const currentUser = auth.currentUser;
    const savedChatsRef = collection(db, "users", currentUser.uid, "savedChats");
    
    try {
        await addDoc(savedChatsRef, {
            savedAt: serverTimestamp(),
            personaAtSave: persona,
            title: messages.find(m => m.sender === 'user')?.text.substring(0, 30) || 'Saved Chat',
            messages: messages.map(m => ({...m, createdAt: m.createdAt}))
        });
        await clearCurrentChat();
        Alert.alert('Chat Saved', 'Your chat has been saved and a new one has started.');
    } catch (error) {
        console.error("Error saving chat: ", error);
        Alert.alert('Error', 'Could not save the chat. Please try again.');
    }
  };

  const clearCurrentChat = async () => {
    const currentUser = auth.currentUser;
    const messagesRef = collection(db, "users", currentUser.uid, "messages");
    
    try {
        const querySnapshot = await getDocs(messagesRef);
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error clearing chat:", error);
        Alert.alert('Error', 'Could not start a new chat. Please try again.');
    }
  };

  const handleNewChat = () => {
    if (messages.length === 0) return;

    Alert.alert(
        "Start New Chat",
        "Would you like to save your current chat before starting a new one?",
        [
            { text: "Don't Save", onPress: () => clearCurrentChat(), style: 'destructive' },
            { text: 'Save Chat', onPress: () => saveChat() },
            { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
    );
  };

  // 6. Render Functions
  const renderMessage = ({ item }) => {
      const isUser = item.sender === 'user';
      const isJert = persona === 'Jert';
      return (
          <View style={[styles.messageRow, isUser ? styles.userMessageRow : styles.aiMessageRow]}>
              {!isUser && (
                  <View style={[styles.aiAvatar, { backgroundColor: isJert ? '#2563eb' : '#9333ea' }]}>
                      <Text style={styles.avatarLetter}>{persona.charAt(0)}</Text>
                  </View>
              )}
              <View style={[
                  styles.messageBubble,
                  isUser 
                    ? (isJert ? styles.userMessageBubbleJert : styles.userMessageBubbleAura) 
                    : styles.aiMessageBubble
              ]}>
                  <Text style={isUser ? styles.userMessageText : styles.aiMessageText}>{item.text}</Text>
              </View>
          </View>
      );
  };
  
  if (!userProfile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333ea" />
        <Text style={styles.loadingText}>Loading Your Space...</Text>
      </SafeAreaView>
    );
  }

  const theme = {
      primary: persona === 'Jert' ? '#2563eb' : '#9333ea',
      header: persona === 'Jert' ? 'Jert' : 'Aura'
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarLetter}>{theme.header.charAt(0)}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{theme.header}</Text>
            {/*<Text style={styles.headerSubtitle}>Here to listen</Text>*/}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleNewChat} style={styles.iconButton}>
            <Icon name="add-circle" size={30} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
            <Icon name="ellipsis-horizontal-circle" size={30} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatArea}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && <ActivityIndicator style={{marginVertical: 10}} color={theme.primary} />}
        
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder="Share what you're feeling..."
                placeholderTextColor="#94a3b8"
                value={inputMessage}
                onChangeText={setInputMessage}
                multiline
            />
            <TouchableOpacity style={[styles.sendButton, {backgroundColor: theme.primary}]} onPress={handleSend}>
                <Icon name="arrow-up" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // --- Main Layout & Loading ---
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 10, color: '#64748b' },
  keyboardView: { flex: 1 },

  // --- New Professional & Friendly Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    paddingTop: 30
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerTextContainer: { flexDirection: 'column' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  iconButton: { marginLeft: 16, padding: 4 },

  // --- Chat Area & Messages ---
  chatArea: { paddingHorizontal: 10, paddingVertical: 20, flexGrow: 1 },
  messageRow: { flexDirection: 'row', marginVertical: 8, alignItems: 'flex-end' },
  userMessageRow: { justifyContent: 'flex-end' },
  aiMessageRow: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, maxWidth: '80%' },
  aiMessageBubble: { backgroundColor: '#e2e8f0', borderTopLeftRadius: 5 },
  userMessageBubbleAura: { backgroundColor: '#9333ea', borderTopRightRadius: 5 },
  userMessageBubbleJert: { backgroundColor: '#2563eb', borderTopRightRadius: 5 },
  aiMessageText: { color: '#1e293b', fontSize: 16, lineHeight: 22 },
  userMessageText: { color: '#fff', fontSize: 16, lineHeight: 22 },

  // --- Input Area ---
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff'
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    marginLeft: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;