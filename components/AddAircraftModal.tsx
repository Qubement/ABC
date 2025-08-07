import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

interface AddAircraftModalProps {
  visible: boolean;
  onClose: () => void;
  editingAircraft?: any;
}

export default function AddAircraftModal({ visible, onClose, editingAircraft }: AddAircraftModalProps) {
  const [formData, setFormData] = useState({
    tailNumber: editingAircraft?.tail_number || '',
    make: editingAircraft?.make || '',
    model: editingAircraft?.model || '',
    serialNumber: editingAircraft?.serial_number || '',
    aircraftType: editingAircraft?.aircraft_type || '',
    engineType: editingAircraft?.engine_type || '',
    seats: editingAircraft?.seats?.toString() || '2',
    hourlyRate: editingAircraft?.hourly_rate?.toString() || '',
    notes: editingAircraft?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const createDefaultSchedule = async (aircraftId: string) => {
    try {
      const today = new Date();
      const scheduleData = [];
      
      // Create schedule for next 30 days, 8 AM to 6 PM
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        for (let hour = 8; hour < 18; hour++) {
          scheduleData.push({
            entity_type: 'aircraft',
            entity_id: aircraftId,
            date: dateStr,
            start_time: `${hour.toString().padStart(2, '0')}:00:00`,
            end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
            is_available: true
          });
        }
      }
      
      const { error } = await supabase
        .from('schedules')
        .insert(scheduleData);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error creating aircraft schedule:', error);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Aircraft',
      'Are you sure you want to delete this aircraft? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete }
      ]
    );
  };

  const handleDelete = async () => {
    if (!editingAircraft?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('aircraft')
        .delete()
        .eq('id', editingAircraft.id);

      if (error) throw error;

      Alert.alert('Success', 'Aircraft deleted successfully', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      console.error('Error deleting aircraft:', error);
      Alert.alert('Error', 'Failed to delete aircraft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tailNumber || !formData.make || !formData.model || !formData.aircraftType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const aircraftData = {
        tail_number: formData.tailNumber,
        make: formData.make,
        model: formData.model,
        serial_number: formData.serialNumber || null,
        aircraft_type: formData.aircraftType,
        engine_type: formData.engineType || null,
        seats: parseInt(formData.seats),
        hourly_rate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        notes: formData.notes || null,
        status: 'available'
      };

      let result;
      if (editingAircraft) {
        result = await supabase
          .from('aircraft')
          .update(aircraftData)
          .eq('id', editingAircraft.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('aircraft')
          .insert(aircraftData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Create default schedule for new aircraft only
      if (!editingAircraft) {
        await createDefaultSchedule(result.data.id);
      }

      Alert.alert(
        'Success', 
        editingAircraft ? 'Info updated successfully' : 'Aircraft added successfully with default schedule'
      );
      
      setFormData({
        tailNumber: '',
        make: '',
        model: '',
        serialNumber: '',
        aircraftType: '',
        engineType: '',
        seats: '2',
        hourlyRate: '',
        notes: ''
      });
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save aircraft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{editingAircraft ? 'Edit Aircraft' : 'Add Aircraft'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tail Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.tailNumber}
              onChangeText={(text) => setFormData({...formData, tailNumber: text})}
              placeholder="N12345"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Make *</Text>
              <TextInput
                style={styles.input}
                value={formData.make}
                onChangeText={(text) => setFormData({...formData, make: text})}
                placeholder="Cessna"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Model *</Text>
              <TextInput
                style={styles.input}
                value={formData.model}
                onChangeText={(text) => setFormData({...formData, model: text})}
                placeholder="172"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Serial Number</Text>
              <TextInput
                style={styles.input}
                value={formData.serialNumber}
                onChangeText={(text) => setFormData({...formData, serialNumber: text})}
                placeholder="17280123"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Aircraft Type *</Text>
              <TextInput
                style={styles.input}
                value={formData.aircraftType}
                onChangeText={(text) => setFormData({...formData, aircraftType: text})}
                placeholder="Single Engine"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hourly Rate ($)</Text>
            <TextInput
              style={styles.input}
              value={formData.hourlyRate}
              onChangeText={(text) => setFormData({...formData, hourlyRate: text})}
              placeholder="150.00"
              keyboardType="decimal-pad"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {editingAircraft && (
          <View style={styles.deleteSection}>
            <TouchableOpacity 
              style={[styles.deleteButton, loading && styles.submitButtonDisabled]} 
              onPress={confirmDelete}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>Delete Aircraft</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    flex: 1,
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
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 15,
  },
  deleteSection: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});