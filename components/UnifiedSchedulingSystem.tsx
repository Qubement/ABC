import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
  created_by: string;
  student_name?: string;
  cfi_name?: string;
  aircraft_tail?: string;
}

interface UnifiedSchedulingSystemProps {
  onScheduleSelect?: (schedule: Schedule) => void;
}

export default function UnifiedSchedulingSystem({ onScheduleSelect }: UnifiedSchedulingSystemProps) {
  const { userRole, userId } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadSchedules();
  }, [userRole, userId, selectedDate]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      let query = supabase.from('schedules').select(`
        *,
        students(name),
        cfis(name),
        aircraft(tail_number)
      `);

      // Role-based filtering
      if (userRole === 'student') {
        query = query.eq('student_id', userId);
      } else if (userRole === 'instructor') {
        query = query.eq('cfi_id', userId);
      }
      // Admin sees all schedules

      query = query.eq('date', selectedDate).order('start_time');

      const { data, error } = await query;
      if (error) throw error;

      const formattedSchedules = data?.map(schedule => ({
        ...schedule,
        student_name: schedule.students?.name || 'Unknown Student',
        cfi_name: schedule.cfis?.name || 'Unknown CFI',
        aircraft_tail: schedule.aircraft?.tail_number || 'Unknown Aircraft'
      })) || [];

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
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

  const canModifySchedule = (schedule: Schedule) => {
    if (userRole === 'administrator') return true;
    if (userRole === 'instructor' && schedule.cfi_id === userId) return true;
    if (userRole === 'student' && schedule.student_id === userId && schedule.status === 'pending') return true;
    return false;
  };

  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId);

      if (error) throw error;
      
      Alert.alert('Success', 'Schedule status updated');
      loadSchedules();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update schedule status');
    }
  };

  const renderScheduleCard = (schedule: Schedule) => (
    <TouchableOpacity
      key={schedule.id}
      style={[styles.scheduleCard, { borderLeftColor: getStatusColor(schedule.status) }]}
      onPress={() => onScheduleSelect?.(schedule)}
    >
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

      {canModifySchedule(schedule) && (
        <View style={styles.actionButtons}>
          {userRole === 'instructor' && schedule.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => handleStatusChange(schedule.id, 'approved')}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                onPress={() => handleStatusChange(schedule.id, 'canceled')}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          
          {(userRole === 'instructor' || userRole === 'administrator') && schedule.status === 'approved' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => handleStatusChange(schedule.id, 'completed')}
            >
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>Date: {selectedDate}</Text>
      </View>
      
      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No schedules for this date</Text>
        </View>
      ) : (
        schedules.map(renderScheduleCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  dateSelector: { padding: 20, backgroundColor: 'white', marginBottom: 10 },
  dateText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  scheduleCard: { 
    backgroundColor: 'white', 
    margin: 10, 
    padding: 15, 
    borderRadius: 8, 
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  timeText: { fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  detailText: { fontSize: 14, color: '#666', marginBottom: 4 },
  actionButtons: { flexDirection: 'row', marginTop: 10, gap: 10 },
  actionButton: { flex: 1, padding: 8, borderRadius: 4, alignItems: 'center' },
  actionButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#666' }
});