import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import CompleteProfileModal from './CompleteProfileModal';
import UpdateStudentProfileModal from './UpdateStudentProfileModal';

interface ProfileFormProps {
  userType: string;
  userEmail?: string;
  accountCategory?: string;
  onSave: (data: any) => void;
}

export default function ProfileForm({ userType, userEmail = '', accountCategory, onSave }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail,
    phone: '',
    licenseNumber: userType === 'instructor' ? '' : undefined,
    studentId: userType === 'student' ? '' : undefined,
  });
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const handleSave = () => {
    if (userType === 'student') {
      setShowStudentModal(true);
    } else {
      setShowCompleteModal(true);
    }
  };

  const handleCompleteProfile = () => {
    onSave(formData);
    setShowCompleteModal(false);
  };

  const handleStudentComplete = () => {
    setShowStudentModal(false);
    onSave(formData);
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
            placeholder="Enter your full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder="Enter your email"
            keyboardType="email-address"
            editable={!userEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        {userType === 'instructor' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Number</Text>
            <TextInput
              style={styles.input}
              value={formData.licenseNumber}
              onChangeText={(text) => setFormData({...formData, licenseNumber: text})}
              placeholder="Enter license number"
            />
          </View>
        )}

        {userType === 'student' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              value={formData.studentId}
              onChangeText={(text) => setFormData({...formData, studentId: text})}
              placeholder="Enter student ID"
            />
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Information</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <CompleteProfileModal
        visible={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        profileData={formData}
        userEmail={formData.email}
        accountCategory={accountCategory}
        onComplete={handleCompleteProfile}
      />
      
      <UpdateStudentProfileModal
        visible={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        userEmail={formData.email}
        onComplete={handleStudentComplete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});