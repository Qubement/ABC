import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';

interface Schedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'completed' | 'canceled';
  student_name?: string;
  cfi_name?: string;
  aircraft_tail?: string;
}

interface AdminScheduleActionsProps {
  schedule: Schedule;
  visible: boolean;
  onClose: () => void;
  onScheduleUpdated: () => void;
}

export default function AdminScheduleActions({ 
  schedule, 
  visible, 
  onClose, 
  onScheduleUpdated 
}: AdminScheduleActionsProps) {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);

  if (userRole !== 'administrator') {
    return null;
  }

  const updateScheduleStatus = async (newStatus: 'pending' | 'approved' | 'completed' | 'canceled') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', schedule.id);

      if (error) throw error;

      Alert.alert('Success', `Schedule ${newStatus} successfully`);
      onScheduleUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async () => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to permanently delete this schedule? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', schedule.id);

              if (error) throw error;

              Alert.alert('Success', 'Schedule deleted successfully');
              onScheduleUpdated();
              onClose();
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', 'Failed to delete schedule');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const statusActions = [
    { status: 'pending', label: 'Mark Pending', color: '#FF9800' },
    { status: 'approved', label: 'Approve', color: '#4CAF50' },
    { status: 'completed', label: 'Mark Completed', color: '#2196F3' },
    { status: 'canceled', label: 'Cancel', color: '#F44336' }
  ] as const;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Actions</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleInfo}>
          <Text style={styles.scheduleTitle}>
            {schedule.date} | {schedule.start_time} - {schedule.end_time}
          </Text>
          <Text style={styles.scheduleDetails}>
            Student: {schedule.student_name}
          </Text>
          <Text style={styles.scheduleDetails}>
            CFI: {schedule.cfi_name}
          </Text>
          <Text style={styles.scheduleDetails}>
            Aircraft: {schedule.aircraft_tail}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
            <Text style={styles.statusText}>Current: {schedule.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Text style={styles.sectionTitle}>Change Status</Text>
          {statusActions.map(action => (
            <TouchableOpacity
              key={action.status}
              style={[
                styles.actionButton,
                { backgroundColor: action.color },
                schedule.status === action.status && styles.currentStatusButton,
                loading && styles.disabledButton
              ]}
              onPress={() => updateScheduleStatus(action.status)}
              disabled={loading || schedule.status === action.status}
            >
              <Text style={styles.actionButtonText}>
                {schedule.status === action.status ? `✓ ${action.label}` : action.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity
              style={[styles.deleteButton, loading && styles.disabledButton]}
              onPress={deleteSchedule}
              disabled={loading}
            >
              <Text style={styles.deleteButtonText}>
                {loading ? 'Deleting...' : 'Delete Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#FF9800';
    case 'approved': return '#4CAF50';
    case 'completed': return '#2196F3';
    case 'canceled': return '#F44336';
    default: return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  closeButton: { padding: 10 },
  closeButtonText: { fontSize: 18, color: '#666' },
  scheduleInfo: { padding: 20, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#eee' },
  scheduleTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: '#333' },
  scheduleDetails: { fontSize: 14, color: '#666', marginBottom: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 8 },
  statusText: { fontSize: 12, color: 'white', fontWeight: '600' },
  actions: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#333' },
  actionButton: { padding: 16, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  currentStatusButton: { opacity: 0.6 },
  disabledButton: { opacity: 0.5 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  dangerZone: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  dangerTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16, color: '#F44336' },
  deleteButton: { backgroundColor: '#F44336', padding: 16, borderRadius: 8, alignItems: 'center' },
  deleteButtonText: { color: 'white', fontSize: 16, fontWeight: '600' }
});