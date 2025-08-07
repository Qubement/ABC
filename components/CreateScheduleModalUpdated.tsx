import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';
import DropdownPicker from './DropdownPicker';
import { getAvailableAircraft } from './AircraftAvailabilityChecker';

interface CreateScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduleCreated: () => void;
  userRole: string;
  currentUserId?: string;
}

interface Entity {
  id: string;
  name: string;
  type: 'student' | 'cfi' | 'aircraft';
}

export default function CreateScheduleModalUpdated({ 
  visible, 
  onClose, 
  onScheduleCreated,
  userRole,
  currentUserId 
}: CreateScheduleModalProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [availableAircraft, setAvailableAircraft] = useState<any[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAircraftSelection, setShowAircraftSelection] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => ({
    label: `${i.toString().padStart(2, '0')}:00`,
    value: i.toString()
  }));

  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      label: date.toLocaleDateString(),
      value: date.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    if (visible) {
      fetchEntities();
    }
  }, [visible, userRole]);

  useEffect(() => {
    if (selectedDate && selectedHour !== '') {
      checkAircraftAvailability();
    }
  }, [selectedDate, selectedHour]);

  const fetchEntities = async () => {
    try {
      const allEntities: Entity[] = [];

      if (userRole === 'administrator') {
        const [studentsRes, cfisRes] = await Promise.all([
          supabase.from('students').select('id, first_name, last_name'),
          supabase.from('cfis').select('id, first_name, last_name')
        ]);

        if (studentsRes.data) {
          studentsRes.data.forEach(s => allEntities.push({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            type: 'student'
          }));
        }

        if (cfisRes.data) {
          cfisRes.data.forEach(c => allEntities.push({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`,
            type: 'cfi'
          }));
        }
      } else if (userRole === 'instructor') {
        const [studentsRes] = await Promise.all([
          supabase.from('students').select('id, first_name, last_name')
        ]);

        if (studentsRes.data) {
          studentsRes.data.forEach(s => allEntities.push({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            type: 'student'
          }));
        }

        if (currentUserId) {
          const { data: cfiData } = await supabase
            .from('cfis')
            .select('first_name, last_name')
            .eq('id', currentUserId)
            .single();
          
          if (cfiData) {
            allEntities.push({
              id: currentUserId,
              name: `${cfiData.first_name} ${cfiData.last_name} (Me)`,
              type: 'cfi'
            });
          }
        }
      }

      setEntities(allEntities);
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const checkAircraftAvailability = async () => {
    if (!selectedDate || selectedHour === '') return;
    
    try {
      const startTime = `${selectedHour.padStart(2, '0')}:00:00`;
      const aircraft = await getAvailableAircraft(selectedDate, startTime);
      setAvailableAircraft(aircraft);
    } catch (error) {
      console.error('Error checking aircraft availability:', error);
    }
  };

  const createSchedule = async () => {
    if (!selectedEntity || !selectedDate || selectedHour === '') {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (showAircraftSelection && !selectedAircraft) {
      Alert.alert('Error', 'Please select an aircraft');
      return;
    }

    setLoading(true);
    try {
      const selectedEntityData = entities.find(e => e.id === selectedEntity);
      if (!selectedEntityData) throw new Error('Entity not found');

      const startTime = `${selectedHour.padStart(2, '0')}:00:00`;
      const endTime = `${(parseInt(selectedHour) + 1).toString().padStart(2, '0')}:00:00`;

      const schedules = [];

      // Create schedule for selected entity
      schedules.push({
        entity_type: selectedEntityData.type,
        entity_id: selectedEntity,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        is_available: true
      });

      // Create aircraft schedule if selected
      if (showAircraftSelection && selectedAircraft) {
        schedules.push({
          entity_type: 'aircraft',
          entity_id: selectedAircraft,
          date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          is_available: false // Aircraft is reserved
        });
      }

      const { error } = await supabase
        .from('schedules')
        .insert(schedules);

      if (error) throw error;

      Alert.alert('Success', 'Schedule created successfully!');
      onScheduleCreated();
      onClose();
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEntity('');
    setSelectedDate('');
    setSelectedHour('');
    setSelectedAircraft('');
    setShowAircraftSelection(false);
    setAvailableAircraft([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Create New Schedule</Text>
          
          <ScrollView style={styles.form}>
            <Text style={styles.label}>Select Entity:</Text>
            <DropdownPicker
              items={entities.map(e => ({ label: `${e.name} (${e.type})`, value: e.id }))}
              value={selectedEntity}
              onValueChange={setSelectedEntity}
              placeholder="Choose entity to schedule"
            />

            <Text style={styles.label}>Select Date:</Text>
            <DropdownPicker
              items={dates}
              value={selectedDate}
              onValueChange={setSelectedDate}
              placeholder="Choose date"
            />

            <Text style={styles.label}>Select Hour:</Text>
            <DropdownPicker
              items={hours}
              value={selectedHour}
              onValueChange={setSelectedHour}
              placeholder="Choose hour"
            />

            {selectedDate && selectedHour !== '' && (
              <View style={styles.aircraftSection}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={[styles.checkbox, showAircraftSelection && styles.checkboxChecked]}
                    onPress={() => setShowAircraftSelection(!showAircraftSelection)}
                  >
                    {showAircraftSelection && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Reserve Aircraft</Text>
                </View>

                {showAircraftSelection && (
                  <View>
                    <Text style={styles.label}>Available Aircraft:</Text>
                    <DropdownPicker
                      items={availableAircraft}
                      value={selectedAircraft}
                      onValueChange={setSelectedAircraft}
                      placeholder="Choose aircraft"
                    />
                    {availableAircraft.length === 0 && (
                      <Text style={styles.noAircraftText}>No aircraft available for this time slot</Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, loading && styles.disabled]} 
              onPress={createSchedule}
              disabled={loading}
            >
              <Text style={styles.createText}>
                {loading ? 'Creating...' : 'Create'}
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
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    maxHeight: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  aircraftSection: {
    marginTop: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#45B7D1',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#45B7D1',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  noAircraftText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#45B7D1',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  disabled: {
    opacity: 0.6,
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  createText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
});
