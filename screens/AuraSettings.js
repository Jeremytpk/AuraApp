import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Platform } from 'react-native';

export default function AuraSettings({ navigation }) {
  const [allowAuraText, setAllowAuraText] = useState(false);
  const [allowedTime, setAllowedTime] = useState('18:00'); // default 6pm

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aura Personal Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Allow Aura to text me sometimes</Text>
        <Switch
          value={allowAuraText}
          onValueChange={setAllowAuraText}
          trackColor={{ false: '#ccc', true: '#D72660' }}
          thumbColor={allowAuraText ? '#fff' : '#fff'}
        />
      </View>
      {allowAuraText && (
        <View style={styles.settingRow}>
          <Text style={styles.label}>Earliest time Aura can text first:</Text>
          {/* Use a simple time picker for demonstration */}
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => {
              // In a real app, use a time picker modal
              const newTime = allowedTime === '18:00' ? '09:00' : '18:00';
              setAllowedTime(newTime);
            }}
          >
            <Text style={styles.timeText}>{allowedTime}</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D72660',
    marginBottom: 32,
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
  },
  label: {
    color: '#A78682',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timeButton: {
    backgroundColor: '#FFE3ED',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginLeft: 12,
  },
  timeText: {
    color: '#D72660',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeBtn: {
    marginTop: 40,
    backgroundColor: '#D72660',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 36,
    alignSelf: 'center',
    shadowColor: '#D72660',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
