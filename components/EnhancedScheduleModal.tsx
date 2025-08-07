import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface Schedule {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  student_id?: string;
  instructor_id?: string;
  cfi_id?: string;
  aircraft_id?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
  created_by?: string;
}

interface EnhancedScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  schedule?: Schedule;
  userRole: 'student' | 'cfi' | 'instructor' | 'administrator';
  userId: string;
  onSave: () => void;
}

export default function EnhancedScheduleModal({ 
  visible, 
  onClose, 
  schedule, 
  userRole, 
  userId, 
  onSave 
}: EnhancedScheduleModalProps) {
  const [formData, setFormData] = useState<Schedule>({
    date: '',
    start_time: '',
    end_time: '',
    status: 'pending',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      if (schedule) {
        setFormData(schedule);
      } else {
        setFormData({
          date: '',
          start_time: '',
          end_time: '',
          status: 'pending',
          notes: '',
          student_id: userRole === 'student' ? userId : undefined,
          instructor_id: userRole === 'instructor' ? userId : undefined,
          cfi_id: userRole === 'cfi' ? userId : undefined
        });
      }
      fetchDropdownData();
    }
  }, [visible, schedule, userRole, userId]);

  const fetchDropdownData = async () => {
    try {
      const [studentsRes, instructorsRes, aircraftRes] = await Promise.all([
        supabase.from('students').select('id, first_name, last_name'),
        supabase.from('cfis').select('id, first_name, last_name'),
        supabase.from('aircraft').select('id, tail_number, make, model')
      ]);

      setStudents(studentsRes.data || []);
      setInstructors(instructorsRes.data || []);
      setAircraft(aircraftRes.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const checkConflicts = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('date', formData.date)
        .neq('status', 'cancelled');

      if (error) throw error;

      const conflicts = data?.filter(existing => {
        if (existing.id === formData.id) return false;
        
        const existingStart = existing.start_time;
        const existingEnd = existing.end_time;
        const newStart = formData.start_time;
        const newEnd = formData.end_time;

        const timeOverlap = newStart < existingEnd && newEnd > existingStart;
        const instructorConflict = formData.instructor_id && existing.instructor_id === formData.instructor_id;
        const aircraftConflict = formData.aircraft_id && existing.aircraft_id === formData.aircraft_id;

        return timeOverlap && (instructorConflict || aircraftConflict);
      });

      return conflicts || [];
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  };

  const handleSave = async () => {
    if (!formData.date || !formData.start_time || !formData.end_time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Check for conflicts
      const conflicts = await checkConflicts();
      if (conflicts.length > 0) {
        Alert.alert('Conflict Detected', 'This time slot conflicts with existing bookings for the instructor or aircraft.');
        setLoading(false);
        return;
      }

      const scheduleData = {
        ...formData,
        created_by: userId,
        updated_at: new Date().toISOString()
      };

      if (schedule?.id) {
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', schedule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('schedules')
          .insert([scheduleData]);

        if (error) throw error;
      }

      Alert.alert('Success', `Schedule ${schedule?.id ? 'updated' : 'created'} successfully`);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const getPermissions = () => {
    return {
      canEdit: userRole === 'administrator' || 
               (userRole === 'cfi' && (!schedule || schedule.status === 'pending')) ||
               (!schedule && ['instructor', 'student'].includes(userRole)),
      canChangeStatus: userRole === 'administrator' || userRole === 'cfi'
    };
  };

  const permissions = getPermissions();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {schedule ? 'Edit Schedule' : 'New Schedule'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={[styles.input, !permissions.canEdit && styles.disabledInput]}
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              placeholder="YYYY-MM-DD"
              editable={permissions.canEdit}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={[styles.input, !permissions.canEdit && styles.disabledInput]}
                value={formData.start_time}
                onChangeText={(text) => setFormData(prev => ({ ...prev, start_time: text }))}
                placeholder="HH:MM"
                editable={permissions.canEdit}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={[styles.input, !permissions.canEdit && styles.disabledInput]}
                value={formData.end_time}
                onChangeText={(text) => setFormData(prev => ({ ...prev, end_time: text }))}
                placeholder="HH:MM"
                editable={permissions.canEdit}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.textArea, !permissions.canEdit && styles.disabledInput]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add notes..."
              multiline
              numberOfLines={3}
              editable={permissions.canEdit}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          {permissions.canEdit && (
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 18, fontWeight: '600' },
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 18, color: '#666' },
  form: { flex: 1, padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: 'white' },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: 'white', height: 80, textAlignVertical: 'top' },
  disabledInput: { backgroundColor: '#f5f5f5', color: '#666' },
  row: { flexDirection: 'row' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  cancelButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#f5f5f5', marginRight: 8, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: '#666' },
  saveButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#007AFF', marginLeft: 8, alignItems: 'center' },
  saveButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  disabledButton: { opacity: 0.5 }
});