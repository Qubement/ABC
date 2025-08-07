import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { supabase } from '@/app/lib/supabase';
import DropdownPicker from './DropdownPicker';

interface CFI {
  id: string;
  first_name: string;
  last_name: string;
}

interface CFIScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduleCreated: () => void;
  selectedCFIId?: string;
}

export default function CFIScheduleModal({ visible, onClose, onScheduleCreated, selectedCFIId }: CFIScheduleModalProps) {
  const [cfis, setCfis] = useState<CFI[]>([]);
  const [selectedCFI, setSelectedCFI] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchCFIs();
      if (selectedCFIId) {
        setSelectedCFI(selectedCFIId);
      }
    }
  }, [visible, selectedCFIId]);

  const fetchCFIs = async () => {
    try {
      const { data, error } = await supabase
        .from('cfis')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      setCfis(data || []);
    } catch (error) {
      console.error('Error fetching CFIs:', error);
      Alert.alert('Error', 'Failed to load CFIs');
    }
  };

  const createCFISchedule = async () => {
    if (!selectedCFI) {
      Alert.alert('Error', 'Please select a CFI');
      return;
    }

    setLoading(true);
    try {
      const today = new Date();
      const scheduleData = [];
      
      // Create schedule for next 7 days, 8 AM to 6 PM
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        for (let hour = 8; hour < 18; hour++) {
          scheduleData.push({
            entity_type: 'cfi',
            entity_id: selectedCFI,
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
      
      Alert.alert('Success', 'CFI schedule created!');
      onScheduleCreated();
      onClose();
      setSelectedCFI('');
    } catch (error) {
      console.error('Schedule creation error:', error);
      Alert.alert('Error', 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const cfiOptions = cfis.map(cfi => ({
    label: `${cfi.first_name} ${cfi.last_name}`,
    value: cfi.id
  }));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add CFI Schedule</Text>
          <Text style={styles.subtitle}>Which CFI would you like to make a schedule for?</Text>
          
          <DropdownPicker
            placeholder="Select CFI"
            items={cfiOptions}
            value={selectedCFI}
            onValueChange={setSelectedCFI}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, loading && styles.disabledButton]} 
              onPress={createCFISchedule}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating...' : 'Create Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
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
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    padding: 12,
    marginLeft: 10,
    backgroundColor: '#45B7D1',
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});