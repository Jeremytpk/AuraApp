import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Reusable Component for showing saved info ---
const ProfileInfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
    </View>
);

// --- Reusable Component for selection buttons (much better UX than text input) ---
const OptionSelector = ({ title, options, selectedValue, onSelect }) => (
    <View style={styles.selectorSection}>
        <Text style={styles.selectorTitle}>{title}</Text>
        <View style={styles.selectorContainer}>
            {options.map((option) => (
                <TouchableOpacity
                    key={option.value}
                    style={[
                        styles.selectorButton,
                        selectedValue === option.value && styles.selectorButtonSelected
                    ]}
                    onPress={() => onSelect(option.value)}
                >
                    <Text style={[
                        styles.selectorText,
                        selectedValue === option.value && styles.selectorTextSelected
                    ]}>{option.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

const ProfileSetupScreen = ({ navigation }) => {
    // --- State Management ---
    const [initialProfile, setInitialProfile] = useState(null); // To store original data for "Cancel"
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true); // Manages both fetching and saving
    
    // Form state
    const [userGender, setUserGender] = useState('');
    const [genderPref, setGenderPref] = useState('');
    const [religion, setReligion] = useState('');
    const [behavior, setBehavior] = useState('standard');

    // --- Data Fetching on Load ---
    useEffect(() => {
        const fetchProfile = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) return;

            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const profileData = docSnap.data();
                // Populate state from Firestore
                setUserGender(profileData.userGender || '');
                setGenderPref(profileData.genderPref || '');
                setReligion(profileData.religion || '');
                setBehavior(profileData.behavior || 'standard');
                setInitialProfile(profileData); // Save for cancellation
                setIsEditMode(false); // User has a profile, so show Display Mode
            } else {
                setIsEditMode(true); // New user, go straight to Edit Mode
                setInitialProfile({}); // Set empty initial profile
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    // --- Event Handlers ---
    const handleSaveProfile = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            Alert.alert("Error", "No authenticated user found.");
            return;
        }
        if (!userGender || !genderPref || !behavior) {
            Alert.alert("Missing Info", "Please select your gender, preferred companion, and a vibe.");
            return;
        }
        
        setLoading(true);
        const userProfile = {
            userGender,
            genderPref,
            religion,
            behavior,
            email: currentUser.email
        };

        try {
            await setDoc(doc(db, "users", currentUser.uid), userProfile);
            setInitialProfile(userProfile); // Update the 'cancel' state
            setIsEditMode(false); // Switch to display mode on successful save
            // If this was the first time setup, navigate to chat
            if (!initialProfile?.userGender) {
                navigation.replace('Chat');
            }
        } catch (error) {
            Alert.alert("Error", "Could not save profile. Please try again.");
            console.error("Profile save error: ", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancel = () => {
        // Revert changes to what was initially fetched
        setUserGender(initialProfile.userGender || '');
        setGenderPref(initialProfile.genderPref || '');
        setReligion(initialProfile.religion || '');
        setBehavior(initialProfile.behavior || 'standard');
        setIsEditMode(false);
    };

    if (loading && initialProfile === null) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#9333ea" style={{flex: 1}}/>
            </SafeAreaView>
        );
    }
    
    // --- Render Logic ---
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.innerContainer}>
                <View style={styles.header}>
                    <Icon name="person-circle-outline" size={50} color="#9333ea" />
                    <Text style={styles.title}>{isEditMode ? 'Update Your Profile' : 'My Profile'}</Text>
                    <Text style={styles.subtitle}>
                        {isEditMode ? 'Changes will update your companion’s responses.' : 'Your info helps create a personal bond.'}
                    </Text>
                </View>

                {isEditMode ? (
                    // --- EDIT MODE ---
                    <View style={styles.formContainer}>
                        <OptionSelector
                            title="I identify as a..."
                            options={[{label: 'Woman', value: 'woman'}, {label: 'Man', value: 'man'}]}
                            selectedValue={userGender}
                            onSelect={setUserGender}
                        />
                        <OptionSelector
                            title="I'd like to talk to a..."
                            options={[{label: 'Woman (Aura)', value: 'woman'}, {label: 'Man (Jert)', value: 'man'}]}
                            selectedValue={genderPref}
                            onSelect={setGenderPref}
                        />
                        <OptionSelector
                            title="Companion Vibe"
                            options={[
                                {label: 'Standard', value: 'standard'},
                                {label: 'Professional', value: 'professional'},
                                {label: 'Ghetto', value: 'ghetto'},
                            ]}
                            selectedValue={behavior}
                            onSelect={setBehavior}
                        />
                        <Text style={styles.selectorTitle}>Religion/Belief System (Optional)</Text>
                        <TextInput style={styles.input} placeholder="e.g., Christian, Spiritual" value={religion} onChangeText={setReligion} />
                        
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveProfile} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} disabled={loading}>
                                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // --- DISPLAY MODE ---
                    <View style={styles.displayContainer}>
                        <ProfileInfoRow label="I identify as" value={initialProfile?.userGender} />
                        <ProfileInfoRow label="My companion is a" value={initialProfile?.genderPref} />
                        <ProfileInfoRow label="Companion Vibe" value={initialProfile?.behavior} />
                        <ProfileInfoRow label="Religion/Belief" value={initialProfile?.religion} />
                        
                        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => setIsEditMode(true)}>
                            <Icon name="pencil" size={16} color="#fff" style={{marginRight: 8}} />
                            <Text style={styles.buttonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Professional Stylesheet ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    innerContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 },
    header: { alignItems: 'center', marginBottom: 32, },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginTop: 8, },
    subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 4, },
    
    // --- Display Mode Styles ---
    displayContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#94a3b8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    infoLabel: { fontSize: 16, color: '#64748b', fontWeight: '500' },
    infoValue: { fontSize: 16, color: '#1e293b', fontWeight: '600', textTransform: 'capitalize' },
    
    // --- Edit Mode Styles ---
    formContainer: { /* Can add container styles if needed */ },
    selectorSection: { marginBottom: 24 },
    selectorTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 12, },
    selectorContainer: { flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap', },
    selectorButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        marginRight: 10,
        marginBottom: 10,
    },
    selectorButtonSelected: { backgroundColor: '#9333ea', borderColor: '#9333ea', },
    selectorText: { color: '#475569', fontWeight: '600', },
    selectorTextSelected: { color: '#fff', },
    input: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    // --- Button Styles ---
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    editButton: { backgroundColor: '#9333ea' },
    buttonGroup: { marginTop: 20 },
    saveButton: { backgroundColor: '#9333ea' },
    cancelButton: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
    cancelButtonText: { color: '#475569' },
});

export default ProfileSetupScreen;