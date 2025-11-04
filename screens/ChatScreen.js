import React, { useState, useRef, useEffect } from 'react';
import { fetchAIResponse } from '../utils/openai';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity, Image, Alert, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import * as ImagePicker from 'expo-image-picker';
import AuraLogo from '../assets/AuraLogo.png';
import { Picker } from '@react-native-picker/picker';
import { storage, auth, db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFocusEffect } from '@react-navigation/native';

const initialMessages = [
  {
    id: '1',
    text: "Hey! Ready to stir up some trouble or solve the world's problems?",
    sender: 'Aura',
  },
];

// Removed duplicate db declaration (already imported from '../firebase')

function ChatScreen({ navigation }) {
  // --- User Profile State ---
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', email: '', personality: '', profilePhoto: '' });
  const [profileLoading, setProfileLoading] = useState(true);

  // --- Fetch User Profile from Firestore ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const profile = {
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              personality: data.personality || '',
              profilePhoto: data.profilePhoto || ''
            };
            setUserProfile(profile);
            setProfileLoading(false);
            console.log('DEBUG: Loaded userProfile for Aura:', profile);
          } else {
            setProfileLoading(false);
            console.log('DEBUG: No userDoc found for current user');
          }
        } else {
          setProfileLoading(false);
          console.log('DEBUG: No currentUser in auth');
        }
      } catch (e) {
        setProfileLoading(false);
        console.log('Failed to fetch user profile:', e);
      }
    };
    fetchUserProfile();
  }, []);
  const [messages, setMessages] = useState(initialMessages);
  const [conversations, setConversations] = useState([]);
  const [showConvoModal, setShowConvoModal] = useState(false);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [personality, setPersonality] = useState('sassy');
  const [playfulCount, setPlayfulCount] = useState(0); // Track playful/gossipy message count
  const [seriousThreshold, setSeriousThreshold] = useState(Math.floor(Math.random() * 3) + 3); // 3-5
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingNewConvo, setPendingNewConvo] = useState(false);
  const [deleteConvoId, setDeleteConvoId] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const flatListRef = useRef(null);

  // Placeholder: get current plan (should be from user profile or AsyncStorage)
  const [currentPlan, setCurrentPlan] = useState('Free'); // Possible: 'Free', 'Trial', 'Basic', 'Pro', 'Coins'
  const [trialDaysLeft, setTrialDaysLeft] = useState(null); // Days left in trial

  // --- Plan Features & Limits ---
  const planFeatures = {
    Free: { limit: 50, photo: false, history: false },
    Princess: { limit: 150, photo: true, history: false },
    Queen: { limit: Infinity, photo: true, history: true },
    Trial: { limit: Infinity, photo: true, history: true },
    Coins: { limit: 9999, photo: true, history: true },
  };
  // --- Load plan from storage and update on navigation focus ---
  useEffect(() => {
    const loadPlan = async () => {
      const storedPlan = await AsyncStorage.getItem('aura_plan');
      if (storedPlan && planFeatures[storedPlan]) {
        setCurrentPlan(storedPlan);
      } else {
        setCurrentPlan('Free');
      }
    };
    loadPlan();
    const unsubscribe = navigation?.addListener?.('focus', loadPlan);
    return unsubscribe;
  }, [navigation]);

  // Load conversations from storage on mount
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('aura_conversations');
      if (saved) setConversations(JSON.parse(saved));
    })();
  }, []);

  // Scroll to end when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Save conversations to storage when changed
  useEffect(() => {
    AsyncStorage.setItem('aura_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Notice profile changes and react
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        const changed = await AsyncStorage.getItem('aura_profile_changed');
        if (changed && isActive) {
          const { field, value } = JSON.parse(changed);
          let reaction = '';
          if (field === 'profilePhoto') {
            reaction = "Whoa! Loving the new profile pic! You look amazing 😍";
          } else if (field === 'firstName' || field === 'lastName') {
            reaction = `Ooh, a name update! Should I call you ${value}?`;
          } else if (field === 'email') {
            reaction = "Email updated! I'll keep your secrets safe, promise.";
          } else if (field === 'personality') {
            reaction = `Switching up the vibes to ${value}? I'm ready! ✨`;
          }
          if (reaction) {
            setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: reaction, sender: 'Aura' }]));
          }
          await AsyncStorage.removeItem('aura_profile_changed');
        }
      })();
      return () => { isActive = false; };
    }, [])
  );

  // Track last user activity
  useEffect(() => {
    const updateLastActive = async () => {
      if (messages.length > 0 && messages[messages.length - 1].sender === 'You') {
        await AsyncStorage.setItem('aura_last_active', Date.now().toString());
      }
    };
    updateLastActive();
  }, [messages]);

  // Inactivity check timers
  const inactivityTimers = useRef([]);
  const [awaitingUser, setAwaitingUser] = useState(false);
  const [inactivityCount, setInactivityCount] = useState(0);
  const [auraPaused, setAuraPaused] = useState(false); // New: pause Aura after 3rd check

  // Clear all inactivity timers
  const clearInactivityTimers = () => {
    inactivityTimers.current.forEach(timer => clearTimeout(timer));
    inactivityTimers.current = [];
  };

  // Start inactivity check after Aura's message
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (auraPaused) {
      // Aura is paused, do not set any inactivity timers
      return;
    }
    if (lastMsg.sender === 'Aura') {
      clearInactivityTimers();
      setAwaitingUser(true);
      // Count how many times Aura has checked in (not including bye)
      let checks = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === 'Aura') {
          if (messages[i].text && messages[i].text.includes('Looks like you') && messages[i].text.includes('bye')) break;
          checks++;
        } else {
          break;
        }
      }
      if (checks === 0) {
        // First check after 2 min
        const timer1 = setTimeout(() => {
          setInactivityCount(1);
          setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: "You still there? Just checking in!", sender: 'Aura' }]));
        }, 2 * 60 * 1000);
        inactivityTimers.current = [timer1];
      } else if (checks === 1) {
        // Second check after 4 min
        const timer2 = setTimeout(() => {
          setInactivityCount(2);
          setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: "Did I lose you? Let me know when you're back!", sender: 'Aura' }]));
        }, 4 * 60 * 1000);
        inactivityTimers.current = [timer2];
      } else if (checks === 2) {
        // Third check after 6 min
        const timer3 = setTimeout(() => {
          setInactivityCount(3);
          setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: "I'm still here if you want to chat!", sender: 'Aura' }]));
        }, 6 * 60 * 1000);
        inactivityTimers.current = [timer3];
      } else if (checks === 3) {
        // Fourth (bye) after 8 min
        const timer4 = setTimeout(() => {
          setInactivityCount(4);
          setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: "Looks like you're away! I'll say bye for now, but I'll be here when you want to chat again. 💖", sender: 'Aura' }]));
          setAwaitingUser(false);
          setAuraPaused(true); // Pause Aura after bye
        }, 8 * 60 * 1000);
        inactivityTimers.current = [timer4];
      }
    } else if (lastMsg.sender === 'You') {
      clearInactivityTimers();
      setAwaitingUser(false);
      setInactivityCount(0);
      setAuraPaused(false); // User sent a message, resume Aura
    }
    // Clean up on unmount
    return clearInactivityTimers;
  }, [messages]);

  // --- Plan Limits ---
  const planLimits = {
    Free: 50,
    Princess: 150,
    Queen: Infinity,
    Trial: Infinity,
    Coins: 9999 // Arbitrary high number for pay-as-you-go
  };
  // --- Track daily message count ---
  const [messageCount, setMessageCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const stored = await AsyncStorage.getItem('aura_msg_count');
      let countObj = stored ? JSON.parse(stored) : {};
      if (countObj.date !== today) {
        countObj = { date: today, count: 0 };
        await AsyncStorage.setItem('aura_msg_count', JSON.stringify(countObj));
      }
      setMessageCount(countObj.count);
    })();
  }, []);
  // --- Update count on send ---
  const handleSendWithLimit = async () => {
    if (loading) return;
    // Aura always replies, even if previously paused
    const limit = features.limit;
    if (messageCount >= limit) {
      setLimitReached(true);
      return;
    }
    setLimitReached(false);
    // Detect goodbye intent
    if (isGoodbye(input)) {
      if (!pendingEnd) {
        // Always show the user's message first
        const userMsg = { id: String(messages.length + 1), text: input, sender: 'You' };
        setMessages([...messages, userMsg, { id: String(messages.length + 2), text: "Are you sure you want to end our chat for now? Should I say bye or do you want to talk later?", sender: 'Aura' }]);
        setPendingEnd(true);
        setInput('');
        return;
      } else {
        // Always show the user's message first
        const userMsg = { id: String(messages.length + 1), text: input, sender: 'You' };
        setMessages([...messages, userMsg, { id: String(messages.length + 2), text: "Bye! I'll be here when you want to talk again. 💖", sender: 'Aura' }]);
        setPendingEnd(false);
        setInput('');
        return;
      }
    }
    await handleSend();
    const today = new Date().toISOString().slice(0, 10);
    const stored = await AsyncStorage.getItem('aura_msg_count');
    let countObj = stored ? JSON.parse(stored) : { date: today, count: 0 };
    if (countObj.date !== today) {
      countObj = { date: today, count: 0 };
    }
    countObj.count += 1;
    setMessageCount(countObj.count);
    await AsyncStorage.setItem('aura_msg_count', JSON.stringify(countObj));
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (auraPaused) return; // Don't let Aura reply if paused after bye
    let prependAura = null;
    // Check inactivity
    const lastActiveStr = await AsyncStorage.getItem('aura_last_active');
    const now = Date.now();
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      // 2 hours = 2 * 60 * 60 * 1000 ms
      if (now - lastActive > 2 * 60 * 60 * 1000) {
        const greetings = [
          "Where have you been? I was starting to think you ghosted me! 😏",
          "Long time no chat! What have you been up to?",
          "Hey stranger! Missed me?",
          "You disappeared! Should I be worried?",
          "Back from your secret mission? Spill the tea!",
          "I was about to send a search party! Where'd you go?",
          "Look who's back! Did you miss my sass?",
          "I was just talking to myself here... Welcome back!",
          "You left me hanging! What's the story?",
          "Aura missed you! Ready to catch up?"
        ];
        prependAura = greetings[Math.floor(Math.random() * greetings.length)];
      }
    }
    const userMsg = { id: String(messages.length + 1), text: input, sender: 'You' };
    let newMessages = [...messages, userMsg];
    if (prependAura) {
      newMessages = [...messages, { id: String(messages.length + 1), text: prependAura, sender: 'Aura' }, userMsg];
    }
    // Intercept user info questions and answer directly
    const lowerInput = input.trim().toLowerCase();
    let directAnswer = null;
    if (["what is my name", "what's my name", "do you know my name", "tell me my name", "who am i"].some(q => lowerInput.includes(q))) {
      directAnswer = userProfile.firstName ? `Your name is ${userProfile.firstName}!` : "I don't know your name yet.";
    } else if (["what is my email", "what's my email", "do you know my email", "tell me my email", "what is my email address", "what's my email address"].some(q => lowerInput.includes(q))) {
      directAnswer = userProfile.email ? `Your email address is ${userProfile.email}.` : "I don't have your email address on file.";
    } else if (["what is my profile photo", "what's my profile photo", "show my profile photo", "do you know my profile photo", "what is my avatar", "what's my avatar"].some(q => lowerInput.includes(q))) {
      directAnswer = userProfile.profilePhoto ? `Here's your profile photo:` : "You don't have a profile photo set.";
    }
    setMessages(newMessages);
    setInput('');
    if (directAnswer) {
      setLoading(true);
      setTimeout(() => {
        setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: directAnswer, sender: 'Aura', ...(userProfile.profilePhoto && lowerInput.includes('photo') ? { image: userProfile.profilePhoto } : {}) }]));
        setLoading(false);
      }, 600);
      return;
    }
    setLoading(true);
    try {
      let nextPlayfulCount = playfulCount;
      if (personality === 'sassy' && (messages.length === 0 || messages[messages.length - 1].sender === 'Aura')) {
        nextPlayfulCount++;
      }
      const aiText = await fetchAIResponse(newMessages, personality, userProfile, nextPlayfulCount, seriousThreshold);
      setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: aiText, sender: 'Aura' }]));
      if (personality === 'sassy' && aiText && /serious/i.test(aiText)) {
        setPlayfulCount(0);
        setSeriousThreshold(Math.floor(Math.random() * 3) + 3);
      } else if (personality === 'sassy') {
        setPlayfulCount(nextPlayfulCount);
      }
    } catch (e) {
      console.log('AI error:', e);
      setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: 'Sorry, I had a brain freeze! 🥶', sender: 'Aura' }]));
    }
    setLoading(false);
  };

  // Save current conversation and start new
  const handleNewConversation = () => {
    if (messages.length > 1) {
      setShowSaveModal(true);
      setPendingNewConvo(true);
    } else {
      setMessages(initialMessages);
      setActiveConvoId(null);
    }
  };

  // Save conversation if user agrees
  const confirmSaveConversation = () => {
    // Use first user message as title
    const firstUserMsg = messages.find(m => m.sender === 'You');
    const title = firstUserMsg ? firstUserMsg.text?.slice(0, 40) || 'Untitled' : 'Untitled';
    setConversations(prev => [
      { id: Date.now().toString(), title, messages },
      ...prev
    ]);
    setMessages(initialMessages);
    setActiveConvoId(null);
    setShowSaveModal(false);
    setPendingNewConvo(false);
  };

  // Discard conversation if user declines
  const discardConversation = () => {
    setMessages(initialMessages);
    setActiveConvoId(null);
    setShowSaveModal(false);
    setPendingNewConvo(false);
  };

  // Open a conversation from the list
  const handleOpenConversation = (convo) => {
    setMessages(convo.messages);
    setActiveConvoId(convo.id);
    setShowConvoModal(false);
  };

  // Handle sending an image
  const handleSendImage = async (imageUri) => {
    const userMsg = { id: String(messages.length + 1), image: imageUri, sender: 'You' };
    setMessages([...messages, userMsg]);
    setLoading(true);
    try {
      // Upload image to Firebase Storage
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `chat_photos/${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
      const imgRef = storageRef(storage, filename);
      await uploadBytes(imgRef, blob);
      const downloadURL = await getDownloadURL(imgRef);
      // Add photo record to Firestore 'photos' collection
      await addDoc(collection(db, 'photos'), {
        url: downloadURL,
        sentAt: new Date().toISOString(),
        sender: 'You',
      });
      // Pass the downloadURL to Aura
  const aiText = await fetchAIResponse([...messages, { ...userMsg, image: downloadURL }], personality, userProfile, playfulCount, seriousThreshold, downloadURL);
      setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: aiText, sender: 'Aura' }]));
    } catch (e) {
      setMessages(msgs => ([...msgs, { id: String(msgs.length + 1), text: 'Sorry, I had a brain freeze! 🥶', sender: 'Aura' }]));
    }
    setLoading(false);
  };

  // Prompt user to pick photo or take photo
  const handlePickPhoto = () => {
    setShowPhotoModal(true);
  };

  // Delete conversation with confirmation
  const handleDeleteConversation = (id) => {
    setDeleteConvoId(id);
  };
  const confirmDeleteConversation = () => {
    setConversations(prev => prev.filter(c => c.id !== deleteConvoId));
    setDeleteConvoId(null);
  };
  const cancelDeleteConversation = () => {
    setDeleteConvoId(null);
  };

  // --- Trial Banner ---
  useEffect(() => {
    (async () => {
      const trialStart = await AsyncStorage.getItem('aura_trial_start');
      if (trialStart) {
        const start = parseInt(trialStart, 10);
        const now = Date.now();
        const days = Math.max(0, 5 - Math.floor((now - start) / (1000 * 60 * 60 * 24)));
        if (days > 0) {
          setCurrentPlan('Trial');
          setTrialDaysLeft(days);
        } else {
          setCurrentPlan('Free');
          setTrialDaysLeft(null);
          await AsyncStorage.setItem('aura_trial_start', '');
        }
      }
    })();
  }, []);

  // --- Enforce plan features in UI ---
  const features = planFeatures[currentPlan] || planFeatures['Free'];

  // --- Conversation End Logic ---
  const [pendingEnd, setPendingEnd] = useState(false);

  // Helper: detect user intent to end conversation
  function isGoodbye(text) {
    const byePhrases = [
      'bye', 'goodbye', 'see you', 'talk later', 'see ya', 'later', 'ciao', 'adios', 'farewell', 'night', 'gn', 'good night', 'im out', 'I’m out', 'I am out', 'leave me', 'stop', 'done', 'end chat', 'end conversation', 'no more', 'that’s all', 'that is all', 'enough', 'I’m done', 'I am done', 'I want to stop', 'I want to end', 'I want to leave', 'I want to go', 'I want to sleep', 'I’m going', 'I am going', 'I’m leaving', 'I am leaving', 'I’m logging off', 'I am logging off', 'logging off', 'log off', 'I’m busy', 'I am busy', 'not now', 'maybe later', 'let’s stop', 'lets stop', 'let’s end', 'lets end', 'let’s pause', 'lets pause', 'pause', 'I’ll go', 'I will go', 'I’ll leave', 'I will leave', 'I’ll talk later', 'I will talk later', 'I’ll see you', 'I will see you', 'I’ll see ya', 'I will see ya', 'I’ll see u', 'I will see u', 'I’ll see you later', 'I will see you later', 'I’ll see ya later', 'I will see ya later', 'I’ll see u later', 'I will see u later',
    ];
    const lower = text.toLowerCase();
    return byePhrases.some(phrase => lower.includes(phrase));
  }

  // Aura always replies, so no pause/resume logic needed

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ position: 'relative' }}>
            <Image source={AuraLogo} style={styles.avatar} />
            {/* Online/Offline dot Messenger style */}
            <View style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 13,
              height: 13,
              borderRadius: 7,
              backgroundColor: auraPaused ? '#bbb' : '#22C55E',
              borderWidth: 2,
              borderColor: '#fff',
              zIndex: 3,
            }} />
            {currentPlan === 'Pro' && (
              <Text style={{ position: 'absolute', top: -16, left: 22, zIndex: 2, fontSize: 28 }}>👑</Text>
            )}
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.headerName}>Aura</Text>
            {/* Online/Offline text removed, dot is now on avatar */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {currentPlan === 'Trial' && (
                <View style={{ backgroundColor: '#FFE066', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#D72660', marginRight: 4 }}>✨</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#D72660' }}>Trial</Text>
                </View>
              )}
              {currentPlan === 'Free' && (
                <View style={{ backgroundColor: '#E0E7FF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#6366F1' }}>Free Plan</Text>
                </View>
              )}
              {currentPlan === 'Princess' && (
                <View style={{ backgroundColor: '#FFD6E0', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#D72660' }}>Princess Plan</Text>
                </View>
              )}
              {currentPlan === 'Queen' && (
                <View style={{ backgroundColor: '#FDE68A', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#B45309', marginRight: 4 }}>👑</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#B45309' }}>Queen Plan</Text>
                </View>
              )}
              {currentPlan === 'Pro' && (
                <View style={{ backgroundColor: '#C7F9CC', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#059669', marginRight: 4 }}>💎</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#059669' }}>Pro Plan</Text>
                </View>
              )}
              {currentPlan === 'Coins' && (
                <View style={{ backgroundColor: '#FFF3CD', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFC107', marginRight: 4 }}>🪙</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFC107' }}>Coins</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={handleNewConversation} style={styles.headerIcon} accessibilityLabel="New Conversation">
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowConvoModal(true)} style={styles.headerIcon} accessibilityLabel="Conversation List">
            <Feather name="list" size={24} color="#fff" />
          </TouchableOpacity>
      {/* Conversation List Modal */}
      <Modal
        visible={showConvoModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowConvoModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowConvoModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Your Conversations</Text>
            <View style={{ flex: 1, width: '100%', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: conversations.length === 0 ? 'center' : 'flex-start' }}>
                  {conversations.length === 0 ? (
                    <Text style={{ color: '#A78682', textAlign: 'center', marginTop: 24 }}>No saved conversations yet.</Text>
                  ) : (
                    conversations.map(convo => (
                      <View key={convo.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Pressable
                          style={({ pressed }) => [styles.convoItem, pressed && { backgroundColor: '#FFE3ED' }]}
                          onPress={() => handleOpenConversation(convo)}
                        >
                          <Text style={styles.convoTitle} numberOfLines={1}>{convo.title}</Text>
                          <Text style={styles.convoMeta}>{convo.messages.length - 1} messages</Text>
                        </Pressable>
                        <TouchableOpacity
                          onPress={() => handleDeleteConversation(convo.id)}
                          style={{ marginLeft: 8, padding: 4 }}
                          accessibilityLabel="Delete Conversation"
                        >
                          <Ionicons name="trash" size={20} color="#D72660" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
              <TouchableOpacity style={[styles.closeModalBtn, { marginTop: 16, alignSelf: 'center' }]} onPress={() => setShowConvoModal(false)}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
      {/* Save Conversation Modal */}
      <Modal
        visible={showSaveModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSaveModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSaveModal(false)}>
          <View style={[styles.modalContent, { alignItems: 'center' }]} onStartShouldSetResponder={() => true} onTouchEnd={e => e.stopPropagation()}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#D72660" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Save this conversation?</Text>
            <Text style={{ color: '#A78682', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>Would you like to save your current chat before starting a new one?</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: '#D72660', marginRight: 8 }]} onPress={confirmSaveConversation}>
                <Text style={styles.closeModalText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: '#FFE3ED', marginLeft: 8, marginRight: 8 }]} onPress={discardConversation}>
                <Text style={[styles.closeModalText, { color: '#D72660' }]}>Don't Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: '#A78682' }]} onPress={() => setShowSaveModal(false)}>
                <Text style={[styles.closeModalText, { color: '#fff' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteConvoId}
        animationType="fade"
        transparent
        onRequestClose={cancelDeleteConversation}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}> 
            <Ionicons name="trash" size={40} color="#D72660" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Delete this conversation?</Text>
            <Text style={{ color: '#A78682', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>Are you sure you want to delete this saved chat? This action cannot be undone.</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: '#D72660', marginRight: 8 }]} onPress={confirmDeleteConversation}>
                <Text style={styles.closeModalText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: '#FFE3ED', marginLeft: 8 }]} onPress={cancelDeleteConversation}>
                <Text style={[styles.closeModalText, { color: '#D72660' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Trial Confirmation Modal */}
      <Modal
        visible={showTrialModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTrialModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}> 
            <Feather name="gift" size={40} color="#D72660" style={{ marginBottom: 12 }} />
            <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Start your 5-Day Free Trial?</Text>
            <Text style={{ color: '#A78682', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>You'll unlock all features for 5 days. After that, you'll return to the Free plan.</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: '#D72660', marginRight: 8 }]}
                onPress={async () => {
                  setShowTrialModal(false);
                  const now = Date.now();
                  await AsyncStorage.setItem('aura_trial_start', now.toString());
                  setCurrentPlan('Trial');
                  setTrialDaysLeft(5);
                }}
              >
                <Text style={styles.closeModalText}>Start Trial</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: '#FFE3ED', marginLeft: 8 }]}
                onPress={() => setShowTrialModal(false)}
              >
                <Text style={[styles.closeModalText, { color: '#D72660' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.headerIcon} accessibilityLabel="Settings">
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Plan/Trial/Coin sign removed as requested */}
      </View>
      {/* Personality dropdown removed as requested */}
      {profileLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF5F8' }}>
          <Text style={{ color: '#D72660', fontSize: 18, fontWeight: 'bold' }}>Loading your profile...</Text>
        </View>
      ) : <>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.message, item.sender === 'Aura' ? styles.aura : styles.user]}>
            <Text style={[styles.sender, item.sender === 'Aura' ? styles.auraSender : styles.userSender]}>{item.sender}:</Text>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.chatImage} />
            ) : null}
            {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />
      {loading && (
        <View style={styles.auraTypingBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.auraTypingText}>Aura is Typing</Text>
            <LottieView
              source={require('../assets/typing_dots.json')}
              autoPlay
              loop
              style={{ width: 40, height: 20, marginLeft: 8 }}
            />
          </View>
        </View>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={handlePickPhoto} style={styles.photoButton} disabled={loading || !features.photo || profileLoading}>
          <Ionicons name="camera" size={24} color={features.photo ? '#D72660' : '#aaa'} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          editable={!loading && !limitReached && !profileLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (loading || limitReached || profileLoading) && styles.sendButtonDisabled]}
          onPress={handleSendWithLimit}
          disabled={loading || limitReached || profileLoading}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      </>}
      {/* Custom Photo Picker Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center', padding: 0, width: 320 }]}> 
            <View style={{ alignItems: 'center', backgroundColor: '#FFE3ED', borderTopLeftRadius: 18, borderTopRightRadius: 18, width: '100%', paddingVertical: 18 }}>
              <Ionicons name="camera" size={40} color="#D72660" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 18, marginBottom: 2, textAlign: 'center' }}>Share a Memory with Aura</Text>
              <Text style={{ color: '#A78682', fontSize: 15, marginBottom: 0, textAlign: 'center', maxWidth: 260 }}>Snap a new photo or pick one from your gallery. Aura loves seeing your world! 📸</Text>
            </View>
            <View style={{ width: '100%', padding: 24, paddingTop: 18 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#D72660', paddingVertical: 16, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center' }}
                onPress={async () => {
                  setShowPhotoModal(false);
                  let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                  if (!result.canceled && result.assets && result.assets[0]?.uri) {
                    handleSendImage(result.assets[0].uri);
                  }
                }}
              >
                <Feather name="image" size={22} color="#D72660" style={{ marginRight: 10 }} />
                <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 16 }}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#D72660', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'center' }}
                onPress={async () => {
                  setShowPhotoModal(false);
                  let result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                  if (!result.canceled && result.assets && result.assets[0]?.uri) {
                    handleSendImage(result.assets[0].uri);
                  }
                }}
              >
                <Feather name="camera" size={22} color="#fff" style={{ marginRight: 10 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Take a New Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: '#A78682', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 }} onPress={() => setShowPhotoModal(false)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {limitReached && (
        <View style={{ backgroundColor: '#FFE3ED', borderRadius: 8, padding: 8, margin: 8, alignSelf: 'center' }}>
          <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 15 }}>
            Message limit reached for your plan today. Upgrade or wait until tomorrow!
          </Text>
        </View>
      )}
      {currentPlan === 'Free' && (
        <>
          <TouchableOpacity
            style={{ backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, margin: 8, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setShowTrialModal(true)}
          >
            <Feather name="gift" size={20} color="#D72660" style={{ marginRight: 8 }} />
            <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 15 }}>
              Try 5-Day Free Trial to unlock all features!
            </Text>
          </TouchableOpacity>
          <Modal
            visible={showTrialModal}
            animationType="fade"
            transparent
            onRequestClose={() => setShowTrialModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { alignItems: 'center' }]}> 
                <Feather name="gift" size={40} color="#D72660" style={{ marginBottom: 12 }} />
                <Text style={{ color: '#D72660', fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>Start your 5-Day Free Trial?</Text>
                <Text style={{ color: '#A78682', fontSize: 15, marginBottom: 24, textAlign: 'center' }}>You'll unlock all features for 5 days. After that, you'll return to the Free plan.</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.closeModalBtn, { backgroundColor: '#D72660', marginRight: 8 }]}
                    onPress={async () => {
                      setShowTrialModal(false);
                      const now = Date.now();
                      await AsyncStorage.setItem('aura_trial_start', now.toString());
                      setCurrentPlan('Trial');
                      setTrialDaysLeft(5);
                    }}
                  >
                    <Text style={styles.closeModalText}>Start Trial</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.closeModalBtn, { backgroundColor: '#FFE3ED', marginLeft: 8 }]}
                    onPress={() => setShowTrialModal(false)}
                  >
                    <Text style={[styles.closeModalText, { color: '#D72660' }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

export default ChatScreen;

const styles = StyleSheet.create({
  headerIcon: {
    marginLeft: 16,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
  backgroundColor: '#fff',
  borderRadius: 18,
  padding: 28,
  marginHorizontal: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 6,
  minWidth: 320,
  minHeight: 300,
  maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D72660',
    marginBottom: 18,
    letterSpacing: 1,
  },
  convoItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: 270,
    alignSelf: 'center',
    shadowColor: '#D72660',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  convoTitle: {
    color: '#D72660',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  convoMeta: {
    color: '#A78682',
    fontSize: 13,
    fontWeight: '500',
  },
  closeModalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 0,
  },
  closeModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  chatImage: {
    width: 180,
    height: 180,
    borderRadius: 16,
    marginVertical: 8,
    alignSelf: 'center',
  },
  photoButton: {
    marginRight: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#FFE3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 22,
    color: '#D72660',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8', // warm pinkish background
  },
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#D72660', // deep pink
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 0,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE3ED',
    borderWidth: 2,
    borderColor: '#FFD6E0',
  },
  headerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerStatus: {
    color: '#FFF5F8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerLabel: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  picker: {
    height: 32,
    width: 150,
    color: '#fff',
    backgroundColor: '#D72660',
  },
  message: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  aura: {
    backgroundColor: '#FFE3ED', // soft pink
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  user: {
    backgroundColor: '#D72660',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 13,
  },
  auraSender: {
    color: '#D72660',
  },
  userSender: {
    color: '#fff',
  },
  messageText: {
    fontSize: 16,
    color: '#222',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#f4f4f8',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#D72660',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendButtonDisabled: {
    backgroundColor: '#aaa',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  auraTypingBar: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE3ED',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 16,
    marginBottom: 8,
    shadowColor: '#D72660',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  auraTypingText: {
    color: '#D72660',
    fontStyle: 'italic',
    fontSize: 15,
    fontWeight: '500',
  },
  planBanner: {
    backgroundColor: '#FFE3ED',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
    paddingVertical: 6,
    alignItems: 'center',
  },
  planBannerText: {
    color: '#D72660',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});