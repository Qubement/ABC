import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import CompleteProfileModal from './CompleteProfileModal';

interface StudentProfileFormProps {
  userEmail: string;
  onComplete: () => void;
}

export default function StudentProfileForm({ userEmail, onComplete }: StudentProfileFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [ftnNumber, setFtnNumber] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleCompleteProfile = () => {
    if (!firstName || !lastName || !phone || !ftnNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setShowModal(true);
  };

  const profileData = {
    firstName,
    lastName,
    phone,
    ftnNumber
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Please fill in your student information</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter your last name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>FTN Number *</Text>
          <TextInput
            style={styles.input}
            value={ftnNumber}
            onChangeText={setFtnNumber}
            placeholder="Enter your FTN number"
          />
        </View>

        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleCompleteProfile}
        >
          <Text style={styles.submitButtonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>

      <CompleteProfileModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        profileData={profileData}
        userEmail={userEmail}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#4ECDC4',
    padding: 30,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});