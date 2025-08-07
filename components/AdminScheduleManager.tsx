import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';

interface Schedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  student_id: string;
  cfi_id: string;
  aircraft_id: string;
  status: 'pending' | 'approved' | 'completed' | 'canceled';
  student_name?: string;
  cfi_name?: string;
  aircraft_tail?: string;
}

interface AdminScheduleManagerProps {
  selectedDate: string;
  schedules: Schedule[];
  onScheduleUpdate: () => void;
  onCreateSchedule?: () => void;
}

export default function AdminScheduleManager({ 
  selectedDate, 
  schedules, 
  onScheduleUpdate 
}: AdminScheduleManagerProps) {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);

  if (userRole !== 'administrator') {
    return null;
  }

  const daySchedules = schedules.filter(s => s.date === selectedDate);

  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId);

      if (error) throw error;

      Alert.alert('Success', `Schedule ${newStatus} successfully`);
      onScheduleUpdate();
    } catch (error) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', scheduleId);

              if (error) throw error;

              Alert.alert('Success', 'Schedule deleted successfully');
              onScheduleUpdate();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'canceled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Controls - {selectedDate}</Text>
      
      {daySchedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No schedules for this date</Text>
          <Text style={styles.emptySubtext}>Use the + New button to create a schedule</Text>
        </View>
      ) : (
        <ScrollView style={styles.schedulesList}>
          {daySchedules.map(schedule => (
            <View key={schedule.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.timeText}>
                  {schedule.start_time} - {schedule.end_time}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                  <Text style={styles.statusText}>{schedule.status.toUpperCase()}</Text>
                </View>
              </View>
              
              <Text style={styles.detailText}>Student: {schedule.student_name}</Text>
              <Text style={styles.detailText}>CFI: {schedule.cfi_name}</Text>
              <Text style={styles.detailText}>Aircraft: {schedule.aircraft_tail}</Text>
              
              <View style={styles.actionButtons}>
                {schedule.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleStatusChange(schedule.id, 'approved')}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                )}
                
                {schedule.status === 'approved' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleStatusChange(schedule.id, 'completed')}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>Complete</Text>
                  </TouchableOpacity>
                )}
                
                {schedule.status !== 'canceled' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleStatusChange(schedule.id, 'canceled')}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteSchedule(schedule.id)}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f0f8ff', borderRadius: 8, padding: 16, margin: 16 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 16, color: '#666', fontWeight: '500' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 4 },
  schedulesList: { maxHeight: 300 },
  scheduleCard: { backgroundColor: 'white', borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, color: 'white', fontWeight: 'bold' },
  detailText: { fontSize: 14, color: '#666', marginBottom: 2 },
  actionButtons: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, minWidth: 70, alignItems: 'center' },
  approveButton: { backgroundColor: '#4CAF50' },
  completeButton: { backgroundColor: '#2196F3' },
  cancelButton: { backgroundColor: '#FF9800' },
  deleteButton: { backgroundColor: '#F44336' },
  actionButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});