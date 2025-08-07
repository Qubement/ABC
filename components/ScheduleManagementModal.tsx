import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface Schedule {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  student_id?: string;
  instructor_id?: string;
  aircraft_id?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
}

interface ScheduleManagementModalProps {
  visible: boolean;
  onClose: () => void;
  schedule?: Schedule;
  userRole: 'student' | 'cfi' | 'instructor' | 'administrator';
  userId: string;
  onSave: () => void;
}

export default function ScheduleManagementModal({ 
  visible, 
  onClose, 
  schedule, 
  userRole, 
  userId, 
  onSave 
}: ScheduleManagementModalProps) {
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
          notes: ''
        });
      }
      fetchDropdownData();
    }
  }, [visible, schedule]);

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

  const handleSave = async () => {
    if (!formData.date || !formData.start_time || !formData.end_time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const scheduleData = {
        ...formData,
        created_by: userId,
        updated_at: new Date().toISOString()
      };

      if (schedule?.id) {
        // Update existing schedule
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', schedule.id);

        if (error) throw error;
      } else {
        // Create new schedule
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

  const handleStatusChange = async (newStatus: string) => {
    if (!schedule?.id) return;

    // Role-based permissions for status changes
    const canChangeStatus = 
      userRole === 'administrator' || 
      (userRole === 'cfi' && ['pending', 'approved', 'cancelled'].includes(newStatus)) ||
      (userRole === 'instructor' && newStatus === 'completed');

    if (!canChangeStatus) {
      Alert.alert('Permission Denied', 'You do not have permission to change this status');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', schedule.id);

      if (error) throw error;

      setFormData(prev => ({ ...prev, status: newStatus as any }));
      Alert.alert('Success', `Schedule status updated to ${newStatus}`);
      onSave();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = userRole === 'administrator' || 
    (userRole === 'cfi' && (!schedule || schedule.status === 'pending')) ||
    (!schedule && (userRole === 'instructor' || userRole === 'student'));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
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
              style={[styles.input, !canEdit && styles.disabledInput]}
              value={formData.date}
              onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              placeholder="YYYY-MM-DD"
              editable={canEdit}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Start Time *</Text>
              <TextInput
                style={[styles.input, !canEdit && styles.disabledInput]}
                value={formData.start_time}
                onChangeText={(text) => setFormData(prev => ({ ...prev, start_time: text }))}
                placeholder="HH:MM"
                editable={canEdit}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>End Time *</Text>
              <TextInput
                style={[styles.input, !canEdit && styles.disabledInput]}
                value={formData.end_time}
                onChangeText={(text) => setFormData(prev => ({ ...prev, end_time: text }))}
                placeholder="HH:MM"
                editable={canEdit}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.textArea, !canEdit && styles.disabledInput]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add notes..."
              multiline
              numberOfLines={3}
              editable={canEdit}
            />
          </View>

          {schedule && (
            <View style={styles.statusSection}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusButtons}>
                {['pending', 'approved', 'completed', 'cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      formData.status === status && styles.activeStatusButton,
                      { backgroundColor: getStatusColor(status) }
                    ]}
                    onPress={() => handleStatusChange(status)}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === status && styles.activeStatusButtonText
                    ]}>
                      {status.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          {canEdit && (
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
      </View>
    </Modal>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return '#4CAF50';
    case 'pending': return '#FF9800';
    case 'cancelled': return '#f44336';
    case 'completed': return '#2196F3';
    default: return '#666';
  }
};

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
  statusSection: { marginTop: 16 },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, opacity: 0.7 },
  activeStatusButton: { opacity: 1 },
  statusButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  activeStatusButtonText: { color: 'white' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  cancelButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#f5f5f5', marginRight: 8, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, color: '#666' },
  saveButton: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#007AFF', marginLeft: 8, alignItems: 'center' },
  saveButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  disabledButton: { opacity: 0.5 }
});