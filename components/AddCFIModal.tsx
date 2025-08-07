import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

interface AddCFIModalProps {
  visible: boolean;
  onClose: () => void;
  editingCFI?: any;
}

export default function AddCFIModal({ visible, onClose, editingCFI }: AddCFIModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [ftnNumber, setFtnNumber] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [driversLicenseUrl, setDriversLicenseUrl] = useState('');
  const [pilotCertificateUrl, setPilotCertificateUrl] = useState('');
  const [medicalCertificateUrl, setMedicalCertificateUrl] = useState('');
  const [ratings, setRatings] = useState({
    CFI: false,
    CFII: false,
    MEI: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingCFI) {
      setEmail(editingCFI.email || '');
      setFirstName(editingCFI.first_name || '');
      setLastName(editingCFI.last_name || '');
      setPhone(editingCFI.phone || '');
      setFtnNumber(editingCFI.ftn_number || '');
      setHourlyRate(editingCFI.hourly_rate?.toString() || '');
      setDriversLicenseUrl(editingCFI.drivers_license_url || '');
      setPilotCertificateUrl(editingCFI.pilot_certificate_url || '');
      setMedicalCertificateUrl(editingCFI.medical_certificate_url || '');
      setRatings({
        CFI: editingCFI.ratings?.includes('CFI') || false,
        CFII: editingCFI.ratings?.includes('CFII') || false,
        MEI: editingCFI.ratings?.includes('MEI') || false
      });
    } else {
      // Reset form for new CFI
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setFtnNumber('');
      setHourlyRate('');
      setDriversLicenseUrl('');
      setPilotCertificateUrl('');
      setMedicalCertificateUrl('');
      setRatings({ CFI: false, CFII: false, MEI: false });
    }
  }, [editingCFI, visible]);

  const handleRatingChange = (rating: string) => {
    setRatings(prev => ({ ...prev, [rating]: !prev[rating] }));
  };

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleSave = async () => {
    if (!email || !firstName || !lastName || !phone || !ftnNumber || !hourlyRate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const finalPassword = password || generateTempPassword();
      const selectedRatings = Object.keys(ratings).filter(key => ratings[key]);
      
      const cfiData = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        ftn_number: ftnNumber,
        hourly_rate: parseFloat(hourlyRate),
        drivers_license_url: driversLicenseUrl,
        pilot_certificate_url: pilotCertificateUrl,
        medical_certificate_url: medicalCertificateUrl,
        ratings: selectedRatings,
        profile_completed: true,
        role: 'cfi'
      };

      let result;
      if (editingCFI) {
        result = await supabase
          .from('cfis')
          .update(cfiData)
          .eq('id', editingCFI.id)
          .select()
          .single();
      } else {
        const { data: existingCFI } = await supabase
          .from('cfis')
          .select('id')
          .eq('email', email)
          .single();
        
        if (existingCFI) {
          Alert.alert('Error', 'A CFI with this email already exists');
          return;
        }

        result = await supabase
          .from('cfis')
          .insert({ ...cfiData, temp_password: finalPassword })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      Alert.alert(
        'Success', 
        editingCFI ? 'Info updated successfully' : `CFI created successfully!\nPassword: ${finalPassword}`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error saving CFI:', error);
      if (error.code === '23505') {
        Alert.alert('Error', 'A CFI with this email already exists');
      } else {
        Alert.alert('Error', 'Failed to save CFI');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{editingCFI ? 'Edit CFI' : 'Add New CFI'}</Text>
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

            {!editingCFI && (
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

            <Text style={styles.label}>Hourly Rate ($) *</Text>
            <TextInput
              style={styles.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="Enter hourly rate"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Driver's License URL</Text>
            <TextInput
              style={styles.input}
              value={driversLicenseUrl}
              onChangeText={setDriversLicenseUrl}
              placeholder="Enter driver's license URL"
            />

            <Text style={styles.label}>Pilot Certificate URL</Text>
            <TextInput
              style={styles.input}
              value={pilotCertificateUrl}
              onChangeText={setPilotCertificateUrl}
              placeholder="Enter pilot certificate URL"
            />

            <Text style={styles.label}>Medical Certificate URL</Text>
            <TextInput
              style={styles.input}
              value={medicalCertificateUrl}
              onChangeText={setMedicalCertificateUrl}
              placeholder="Enter medical certificate URL"
            />

            <Text style={styles.label}>Ratings</Text>
            {Object.keys(ratings).map(rating => (
              <TouchableOpacity
                key={rating}
                style={styles.checkboxRow}
                onPress={() => handleRatingChange(rating)}
              >
                <Ionicons
                  name={ratings[rating] ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={ratings[rating] ? '#007AFF' : '#666'}
                />
                <Text style={styles.checkboxLabel}>{rating}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});