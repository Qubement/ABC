import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { supabase } from '@/app/lib/supabase';
import DropdownPicker from './DropdownPicker';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface StudentScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onScheduleCreated: () => void;
  selectedStudentId?: string;
}

export default function StudentScheduleModal({ visible, onClose, onScheduleCreated, selectedStudentId }: StudentScheduleModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchStudents();
      if (selectedStudentId) {
        setSelectedStudent(selectedStudentId);
      }
    }
  }, [visible, selectedStudentId]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const createStudentSchedule = async () => {
    if (!selectedStudent) {
      Alert.alert('Error', 'Please select a student');
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
            entity_type: 'student',
            entity_id: selectedStudent,
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
      
      Alert.alert('Success', 'Student schedule created!');
      onScheduleCreated();
      onClose();
      setSelectedStudent('');
    } catch (error) {
      console.error('Schedule creation error:', error);
      Alert.alert('Error', 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  const studentOptions = students.map(student => ({
    label: `${student.first_name} ${student.last_name}`,
    value: student.id
  }));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add Student Schedule</Text>
          <Text style={styles.subtitle}>Which student would you like to make a schedule for?</Text>
          
          <DropdownPicker
            placeholder="Select Student"
            items={studentOptions}
            value={selectedStudent}
            onValueChange={setSelectedStudent}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, loading && styles.disabledButton]} 
              onPress={createStudentSchedule}
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