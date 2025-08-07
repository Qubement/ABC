import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import StudentRatingCheckboxes from './StudentRatingCheckboxes';

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  editingStudent?: any;
}

export default function AddStudentModal({ visible, onClose, editingStudent }: AddStudentModalProps) {
  const [email, setEmail] = useState(editingStudent?.email || '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(editingStudent?.first_name || '');
  const [lastName, setLastName] = useState(editingStudent?.last_name || '');
  const [phone, setPhone] = useState(editingStudent?.phone || '');
  const [ftnNumber, setFtnNumber] = useState(editingStudent?.ftn_number || '');
  const [ratings, setRatings] = useState<string[]>(editingStudent?.ratings || []);
  const [paymentStatus, setPaymentStatus] = useState(editingStudent?.payment_status || 'unpaid');
  const [loading, setLoading] = useState(false);

  const handleRatingChange = (rating: string) => {
    setRatings(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleInactiveStudent = async () => {
    if (!editingStudent) return;
    
    Alert.alert(
      'Move to Inactive Students',
      'Are you sure you want to move this student to inactive status?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Move', style: 'destructive', onPress: moveToInactive }
      ]
    );
  };

  const moveToInactive = async () => {
    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('inactive_students')
        .insert({
          email: editingStudent.email,
          first_name: editingStudent.first_name,
          last_name: editingStudent.last_name,
          phone: editingStudent.phone,
          ftn_number: editingStudent.ftn_number,
          ratings: editingStudent.ratings,
          moved_date: new Date().toISOString()
        });

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', editingStudent.id);

      if (deleteError) throw deleteError;

      Alert.alert('Success', 'Student moved to inactive status successfully', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      console.error('Error moving student:', error);
      Alert.alert('Error', 'Failed to move student to inactive status');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email || !firstName || !lastName || !phone || !ftnNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const finalPassword = password || generateTempPassword();
      
      const studentData = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        ftn_number: ftnNumber,
        ratings,
        payment_status: paymentStatus,
        status: 'active',
        role: 'student'
      };

      let result;
      if (editingStudent) {
        result = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('students')
          .insert({ ...studentData, password: finalPassword })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      Alert.alert(
        'Success', 
        editingStudent ? 'Info updated successfully' : `Student created successfully!\nPassword: ${finalPassword}`,
        [{ text: 'OK', onPress: () => {
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
          setPhone('');
          setFtnNumber('');
          setRatings([]);
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('Error', 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{editingStudent ? 'Edit Student' : 'Add New Student'}</Text>
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

            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {!editingStudent && (
              <>
                <Text style={styles.label}>Password (leave blank for auto-generated)</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password or leave blank"
                  secureTextEntry
                />
              </>
            )}

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

            <Text style={styles.label}>Payment Status</Text>
            <View style={styles.paymentContainer}>
              <TouchableOpacity 
                style={[styles.paymentButton, paymentStatus === 'paid' && styles.paymentButtonActive]}
                onPress={() => setPaymentStatus('paid')}
              >
                <Text style={[styles.paymentText, paymentStatus === 'paid' && styles.paymentTextActive]}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.paymentButton, paymentStatus === 'unpaid' && styles.paymentButtonActive]}
                onPress={() => setPaymentStatus('unpaid')}
              >
                <Text style={[styles.paymentText, paymentStatus === 'unpaid' && styles.paymentTextActive]}>Unpaid</Text>
              </TouchableOpacity>
            </View>

            <StudentRatingCheckboxes 
              ratings={ratings}
              onRatingChange={handleRatingChange}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.disabledButton]} 
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              
              {editingStudent && (
                <TouchableOpacity 
                  style={[styles.inactiveButton, loading && styles.disabledButton]} 
                  onPress={handleInactiveStudent}
                  disabled={loading}
                >
                  <Text style={styles.inactiveButtonText}>Inactive Student</Text>
                </TouchableOpacity>
              )}
            </View>
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
  buttonContainer: {
    gap: 10,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  inactiveButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inactiveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  paymentButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  paymentButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  paymentText: {
    fontSize: 16,
    color: '#666',
  },
  paymentTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});