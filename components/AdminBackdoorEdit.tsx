import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './AdminBackdoorStyles';
import { supabase } from '../app/lib/supabase';

interface AdminBackdoorEditProps {
  editingItem: any;
  editForm: any;
  editRatings: any;
  setEditForm: (form: any) => void;
  handleRatingChange: (rating: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  deleteItem: () => void;
  refreshData: () => void;
}

export default function AdminBackdoorEdit({
  editingItem,
  editForm,
  editRatings,
  setEditForm,
  handleRatingChange,
  saveEdit,
  cancelEdit,
  deleteItem,
  refreshData
}: AdminBackdoorEditProps) {
  if (!editingItem) return null;

  const moveToInactive = async () => {
    try {
      const { error: insertError } = await supabase
        .from('inactive_students')
        .insert({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          date_of_birth: editForm.date_of_birth,
          address: editForm.address,
          emergency_contact_name: editForm.emergency_contact_name,
          emergency_contact_phone: editForm.emergency_contact_phone,
          medical_certificate_expiry: editForm.medical_certificate_expiry,
          pilot_license_number: editForm.pilot_license_number,
          total_flight_hours: editForm.total_flight_hours || 0,
          solo_hours: editForm.solo_hours || 0,
          cross_country_hours: editForm.cross_country_hours || 0,
          night_hours: editForm.night_hours || 0,
          instrument_hours: editForm.instrument_hours || 0,
          goals: editForm.goals,
          notes: editForm.notes,
          balance: editForm.balance || 0,
          hourly_rate: editForm.hourly_rate || 0,
          password: editForm.password,
          profile_completed: editForm.profile_completed || false
        });
      
      if (insertError) throw insertError;
      
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', editForm.id);
      
      if (deleteError) throw deleteError;
      
      Alert.alert('Success', 'Student moved to inactive database successfully');
      cancelEdit();
      refreshData();
    } catch (error) {
      Alert.alert('Error', `Failed to move student: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      let tableName = '';
      
      switch (editingItem.type) {
        case 'student':
          tableName = 'students';
          break;
        case 'cfi':
          tableName = 'cfis';
          break;
        case 'admin':
          tableName = 'admins';
          break;
        case 'aircraft':
          tableName = 'aircraft';
          break;
        default:
          throw new Error('Unknown item type');
      }
      
      console.log(`Deleting ${editingItem.type} with ID ${editingItem.id} from table ${tableName}`);
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', editingItem.id);
      
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      Alert.alert('Success', `${editingItem.type} deleted successfully`);
      cancelEdit();
      refreshData();
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', `Failed to delete ${editingItem.type}: ${error.message}`);
    }
  };

  const confirmDelete = () => {
    const itemType = editingItem.type;
    Alert.alert(
      `Delete ${itemType}`,
      `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete }
      ]
    );
  };

  const getFields = () => {
    if (editingItem.type === 'student') {
      return ['first_name', 'last_name', 'email', 'password', 'phone'];
    } else if (editingItem.type === 'cfi') {
      return ['first_name', 'last_name', 'email', 'temp_password', 'phone', 'hourly_rate'];
    } else if (editingItem.type === 'admin') {
      return ['first_name', 'last_name', 'email', 'password'];
    } else {
      return ['tail_number', 'make', 'model', 'hourly_rate', 'status'];
    }
  };

  const getFieldLabel = (field: string) => {
    if (field === 'hourly_rate' && editingItem.type === 'aircraft') {
      return 'HOURLY RATE - WET';
    }
    return field.replace('_', ' ').toUpperCase();
  };

  const getTitle = () => {
    if (editingItem.type === 'aircraft') {
      return 'Edit Aircraft';
    }
    return `Edit ${editingItem.type}`;
  };

  const formatValue = (field: string, value: any) => {
    if (field === 'hourly_rate' && editingItem.type === 'aircraft') {
      return value ? `$${value}` : '$';
    }
    return String(value || '');
  };

  const handleInputChange = (field: string, text: string) => {
    if (field === 'hourly_rate' && editingItem.type === 'aircraft') {
      const numericValue = text.replace(/[^0-9.]/g, '');
      setEditForm({...editForm, [field]: numericValue});
    } else {
      setEditForm({...editForm, [field]: text});
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editTitle}>{getTitle()}</Text>
          <ScrollView>
            {getFields().map(field => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {getFieldLabel(field)}
                </Text>
                <TextInput
                  style={styles.input}
                  value={formatValue(field, editForm[field])}
                  onChangeText={(text) => handleInputChange(field, text)}
                  keyboardType={field.includes('rate') ? 'numeric' : 'default'}
                  secureTextEntry={field.includes('password')}
                />
              </View>
            ))}
            
            {editingItem.type === 'admin' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ROLES</Text>
                {['super_admin', 'user_acc_manager', 'schedule_manager', 'financial_acc_manager', 'is_cfi'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={styles.checkboxRow}
                    onPress={() => setEditForm({...editForm, [role]: !editForm[role]})}
                  >
                    <Ionicons
                      name={editForm[role] ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={editForm[role] ? '#4ECDC4' : '#666'}
                    />
                    <Text style={styles.checkboxLabel}>{role === 'is_cfi' ? 'CFI' : role.replace('_', ' ').toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
          <View style={styles.editButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.deleteSection}>
            {editingItem.type === 'student' && (
              <TouchableOpacity style={styles.inactiveButton} onPress={moveToInactive}>
                <Text style={styles.inactiveButtonText}>Inactive Student</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
              <Text style={styles.deleteButtonText}>Delete {editingItem.type}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}