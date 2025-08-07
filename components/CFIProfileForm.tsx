import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import DocumentUploadField from './DocumentUploadField';
import CFIRatingCheckboxes from './CFIRatingCheckboxes';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';
import { useRouter } from 'expo-router';

interface CFIProfileFormProps {
  onComplete: () => void;
}

export default function CFIProfileForm({ onComplete }: CFIProfileFormProps) {
  const { userEmail, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [ftnNumber, setFtnNumber] = useState('');
  const [ratings, setRatings] = useState<string[]>([]);
  const [driversLicenseUrl, setDriversLicenseUrl] = useState('');
  const [pilotCertificateUrl, setPilotCertificateUrl] = useState('');
  const [medicalCertificateUrl, setMedicalCertificateUrl] = useState('');

  useEffect(() => {
    if (userEmail) {
      loadCFIProfile();
    } else {
      setLoading(false);
    }
  }, [userEmail]);

  const loadCFIProfile = async () => {
    try {
      console.log('CFIProfileForm: Loading profile for email:', userEmail);
      
      const { data, error } = await supabase
        .from('cfis')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      console.log('CFIProfileForm: Data loaded:', data);
      console.log('CFIProfileForm: Error:', error);

      if (error && error.code !== 'PGRST116') {
        console.error('CFIProfileForm: Database error:', error);
        Alert.alert('Error', 'Failed to load profile data');
        setLoading(false);
        return;
      }

      if (data) {
        console.log('CFIProfileForm: Populating fields');
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
        setFtnNumber(data.ftn_number || '');
        setRatings(Array.isArray(data.ratings) ? data.ratings : []);
        setDriversLicenseUrl(data.drivers_license_url || '');
        setPilotCertificateUrl(data.pilot_certificate_url || '');
        setMedicalCertificateUrl(data.medical_certificate_url || '');
      } else {
        console.log('CFIProfileForm: No existing data found, starting fresh');
      }
    } catch (error) {
      console.error('CFIProfileForm: Unexpected error:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating: string) => {
    setRatings(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const handleUpdateProfile = async () => {
    if (!firstName || !lastName || !phone) {
      Alert.alert('Error', 'Please fill in all required fields (First Name, Last Name, Phone)');
      return;
    }

    setUpdating(true);
    try {
      console.log('CFIProfileForm: Updating profile - overwriting all data');

      // First delete existing record to ensure complete overwrite
      await supabase
        .from('cfis')
        .delete()
        .eq('email', userEmail);

      // Insert new complete record
      const profileData = {
        email: userEmail,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        ftn_number: ftnNumber,
        ratings: ratings,
        drivers_license_url: driversLicenseUrl,
        pilot_certificate_url: pilotCertificateUrl,
        medical_certificate_url: medicalCertificateUrl,
        profile_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cfis')
        .insert(profileData);

      if (error) {
        console.error('CFIProfileForm: Update error:', error);
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      console.log('CFIProfileForm: Profile updated successfully');
      
      // Call onComplete to refresh the profile checker
      onComplete();
      
      // Navigate to dashboard
      router.push('/cfi-dashboard');
      
      Alert.alert('Success', 'Profile updated successfully!');
      
    } catch (error) {
      console.error('CFIProfileForm: Unexpected error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Update CFI Profile</Text>
        <Text style={styles.subtitle}>Update your instructor information</Text>
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
          <Text style={styles.label}>FTN Number</Text>
          <TextInput
            style={styles.input}
            value={ftnNumber}
            onChangeText={setFtnNumber}
            placeholder="Enter your FTN number"
          />
        </View>

        <CFIRatingCheckboxes 
          ratings={ratings}
          onRatingChange={handleRatingChange}
        />

        <DocumentUploadField
          label="Driver's License"
          value={driversLicenseUrl}
          onValueChange={setDriversLicenseUrl}
          userId={userId}
          documentType="drivers_license"
        />

        <DocumentUploadField
          label="Pilot Certificate"
          value={pilotCertificateUrl}
          onValueChange={setPilotCertificateUrl}
          userId={userId}
          documentType="pilot_certificate"
        />

        <DocumentUploadField
          label="Medical Certificate"
          value={medicalCertificateUrl}
          onValueChange={setMedicalCertificateUrl}
          userId={userId}
          documentType="medical_certificate"
        />

        <TouchableOpacity 
          style={[styles.submitButton, updating && styles.submitButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={updating}
        >
          <Text style={styles.submitButtonText}>
            {updating ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});