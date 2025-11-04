import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { updateProfile, updateEmail, sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';

const AccountScreen = ({ navigation }) => {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (currentUser) {
            setDisplayName(currentUser.displayName || '');
            setEmail(currentUser.email || '');
        }
    }, [currentUser]);

    const handleUpdate = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Update Display Name if it has changed
            if (displayName !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName });
            }

            // Update Email if it has changed
            if (email.toLowerCase() !== currentUser.email.toLowerCase()) {
                await updateEmail(currentUser, email);
            }

            Alert.alert("Success", "Your account information has been updated.");
        } catch (error) {
            console.error("Account update error: ", error);
            // This specific error means the user needs to log in again to perform this sensitive action.
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                    "Session Expired",
                    "For your security, please log out and log back in before changing your email."
                );
            } else {
                Alert.alert("Error", error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = () => {
        if (!currentUser?.email) return;

        Alert.alert(
            "Change Password",
            `A password reset link will be sent to ${currentUser.email}. Are you sure?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send Link",
                    onPress: () => {
                        sendPasswordResetEmail(auth, currentUser.email)
                            .then(() => {
                                Alert.alert("Check Your Email", "A password reset link has been sent to you.");
                            })
                            .catch((error) => {
                                Alert.alert("Error", error.message);
                            });
                    },
                },
            ]
        );
    };
    
    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-back-outline" size={28} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Settings</Text>
                <View style={{width: 40}} />
            </View>

            <ScrollView contentContainerStyle={styles.innerContainer}>
                <View style={styles.card}>
                    <Text style={styles.inputLabel}>Display Name</Text>
                    <TextInput
                        style={styles.input}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Enter your display name"
                    />

                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.inputLabel}>Password</Text>
                     <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handlePasswordReset}>
                        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Send Password Reset Email</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#1e293b' },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    innerContainer: { padding: 24 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#94a3b8",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8fafc',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#9333ea',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#9333ea',
    },
    secondaryButtonText: {
        color: '#9333ea',
    },
});

export default AccountScreen;