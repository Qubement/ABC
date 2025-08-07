import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

interface SettingsDropdownProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsDropdown({ visible, onClose }: SettingsDropdownProps) {
  const { logout } = useAuth();
  const [showNameModal, setShowNameModal] = useState(false);
  const [companyName, setCompanyName] = useState('');

  const handleLogoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const { error } = await supabase
          .from('company_settings')
          .upsert({
            id: 1,
            logo_url: result.assets[0].uri,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        Alert.alert('Success', 'Company logo uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload logo');
    }
    onClose();
  };

  const handleNameSave = async () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          id: 1,
          company_name: companyName.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      Alert.alert('Success', 'Company name saved successfully');
      setShowNameModal(false);
      setCompanyName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save company name');
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={onClose}>
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleLogoUpload}
            >
              <Ionicons name="image" size={20} color="#007AFF" />
              <Text style={styles.menuText}>Add Company Logo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                onClose();
                setShowNameModal(true);
              }}
            >
              <Ionicons name="business" size={20} color="#007AFF" />
              <Text style={styles.menuText}>Add Company Name</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color="#FF3B30" />
              <Text style={[styles.menuText, { color: '#FF3B30' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.nameModal}>
            <Text style={styles.modalTitle}>Add Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              value={companyName}
              onChangeText={setCompanyName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setShowNameModal(false);
                  setCompanyName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleNameSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  dropdown: { position: 'absolute', top: 60, right: 20, backgroundColor: 'white', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, minWidth: 200 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 10 },
  menuText: { fontSize: 16, color: '#333' },
  separator: { height: 1, backgroundColor: '#eee', marginHorizontal: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  nameModal: { backgroundColor: 'white', padding: 20, borderRadius: 12, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelButton: { flex: 1, backgroundColor: '#ccc', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveButton: { flex: 1, backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: '#333', fontWeight: 'bold' },
  saveButtonText: { color: 'white', fontWeight: 'bold' }
});