import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import { router } from 'expo-router';
import StudentRatingCheckboxes from './StudentRatingCheckboxes';
import DocumentUploadField from './DocumentUploadField';

interface UpdateStudentProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail: string;
  onComplete?: () => void;
}

export default function UpdateStudentProfileModal({ visible, onClose, userEmail, onComplete }: UpdateStudentProfileModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [ftnNumber, setFtnNumber] = useState('');
  const [ratings, setRatings] = useState<string[]>([]);
  const [driversLicenseUrl, setDriversLicenseUrl] = useState('');
  const [pilotCertificateUrl, setPilotCertificateUrl] = useState('');
  const [medicalCertificateUrl, setMedicalCertificateUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserRole, setProfileCompleted } = useAuth();

  useEffect(() => {
    if (visible && userEmail) {
      loadStudentData();
    }
  }, [visible, userEmail]);

  const loadStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error) throw error;

      if (data) {
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setPhone(data.phone || '');
        setFtnNumber(data.ftn_number || '');
        setRatings(data.ratings || []);
        setDriversLicenseUrl(data.drivers_license_url || '');
        setPilotCertificateUrl(data.pilot_certificate_url || '');
        setMedicalCertificateUrl(data.medical_certificate_url || '');
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const handleRatingChange = (rating: string) => {
    setRatings(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const handleCompleteProfile = async () => {
    if (!firstName || !lastName || !phone || !ftnNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        phone,
        ftn_number: ftnNumber,
        ratings,
        drivers_license_url: driversLicenseUrl,
        pilot_certificate_url: pilotCertificateUrl,
        medical_certificate_url: medicalCertificateUrl,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('email', userEmail);

      if (error) throw error;

      setUserRole('student');
      setProfileCompleted(true);
      onClose();
      
      if (onComplete) {
        onComplete();
      } else {
        router.push('/(tabs)');
      }
      
    } catch (error) {
      console.error('Error updating student profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Student Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>FTN Number *</Text>
            <TextInput
              style={styles.input}
              value={ftnNumber}
              onChangeText={setFtnNumber}
              placeholder="Enter FTN number"
            />

            <StudentRatingCheckboxes 
              ratings={ratings}
              onRatingChange={handleRatingChange}
            />

            <DocumentUploadField
              label="Driver's License"
              documentUrl={driversLicenseUrl}
              onUpload={setDriversLicenseUrl}
              bucketName="user-documents"
              folder="drivers-licenses"
            />

            <DocumentUploadField
              label="Pilot Certificate"
              documentUrl={pilotCertificateUrl}
              onUpload={setPilotCertificateUrl}
              bucketName="user-documents"
              folder="pilot-certificates"
            />

            <DocumentUploadField
              label="Medical Certificate"
              documentUrl={medicalCertificateUrl}
              onUpload={setMedicalCertificateUrl}
              bucketName="user-documents"
              folder="medical-certificates"
            />

            <TouchableOpacity 
              style={[styles.completeButton, loading && styles.disabledButton]} 
              onPress={handleCompleteProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.completeButtonText}>Complete Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
    maxHeight: '80%',
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
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  completeButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});