import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './lib/supabase';
import DocumentUpload from '../components/DocumentUpload';

export default function StudentSignup() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [ftnNumber, setFtnNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [driversLicense, setDriversLicense] = useState<string | null>(null);
  const [pilotsLicense, setPilotsLicense] = useState<string | null>(null);
  const [faaMedical, setFaaMedical] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !phone || !name || !ftnNumber || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!driversLicense) {
      Alert.alert('Error', 'Driver\'s license photo is required');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Insert student into database
      const { error } = await supabase
        .from('students')
        .insert({
          email: email.toLowerCase(),
          phone,
          name,
          ftn_number: ftnNumber,
          password: password,
          drivers_license_uri: driversLicense,
          pilots_license_uri: pilotsLicense,
          faa_medical_uri: faaMedical,
          profile_completed: true
        });

      if (error) {
        console.error('Error creating student:', error);
        Alert.alert('Error', 'Failed to create student account');
        return;
      }

      Alert.alert(
        'Success', 
        'Student account created successfully!',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Ionicons name="person-add" size={50} color="#007AFF" />
        <Text style={styles.title}>Student Registration</Text>
        <Text style={styles.subtitle}>Create your student account</Text>
      </View>

      <View style={styles.formSection}>
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="FTN Number *"
          value={ftnNumber}
          onChangeText={setFtnNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Create Password *"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password *"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View style={styles.documentsSection}>
        <Text style={styles.sectionTitle}>Required Documents</Text>
        <DocumentUpload
          title="Driver's License"
          required
          onUpload={setDriversLicense}
          uploadedUri={driversLicense}
        />
        
        <Text style={styles.sectionTitle}>Optional Documents</Text>
        <DocumentUpload
          title="Pilot's License"
          onUpload={setPilotsLicense}
          uploadedUri={pilotsLicense}
        />
        <DocumentUpload
          title="FAA Medical Certificate"
          onUpload={setFaaMedical}
          uploadedUri={faaMedical}
        />
      </View>

      <TouchableOpacity 
        style={[styles.signupButton, loading && styles.disabledButton]} 
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.signupButtonText}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>← Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 30,
  },
  documentsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
  },
});