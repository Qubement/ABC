import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';
import ImprovedCalendarView from './ImprovedCalendarView';

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

interface FixedScheduleManagerProps {
  entityType: 'aircraft' | 'cfi' | 'student';
  entityId: string;
  entityName: string;
}

export default function FixedScheduleManager({ entityType, entityId, entityName }: FixedScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchSchedules();
  }, [entityId, entityType]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      let query = supabase.from('schedules').select(`
        *,
        students(first_name, last_name),
        cfis(first_name, last_name),
        aircraft(tail_number)
      `);

      // Filter based on entity type
      if (entityType === 'student') {
        query = query.eq('student_id', entityId);
      } else if (entityType === 'cfi') {
        query = query.eq('cfi_id', entityId);
      } else if (entityType === 'aircraft') {
        query = query.eq('aircraft_id', entityId);
      }

      query = query.order('date', { ascending: true }).order('start_time', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const formattedSchedules = data?.map(schedule => ({
        ...schedule,
        student_name: schedule.students ? `${schedule.students.first_name} ${schedule.students.last_name}` : 'Unknown Student',
        cfi_name: schedule.cfis ? `${schedule.cfis.first_name} ${schedule.cfis.last_name}` : 'Unknown CFI',
        aircraft_tail: schedule.aircraft?.tail_number || 'Unknown Aircraft'
      })) || [];

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const updateScheduleStatus = async (scheduleId: string, newStatus: 'pending' | 'approved' | 'completed' | 'canceled') => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', scheduleId);
      
      if (error) throw error;
      fetchSchedules();
      Alert.alert('Success', 'Schedule status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update schedule status');
    }
  };

  const getEntityTitle = () => {
    switch (entityType) {
      case 'student': return `Student: ${entityName}`;
      case 'cfi': return `CFI: ${entityName}`;
      case 'aircraft': return `Aircraft: ${entityName}`;
      default: return entityName;
    }
  };

  const getEntityColor = () => {
    switch (entityType) {
      case 'student': return '#4CAF50';
      case 'cfi': return '#FF9800';
      case 'aircraft': return '#2196F3';
      default: return '#007AFF';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getEntityColor() }]}>
        <Text style={styles.title}>{getEntityTitle()}</Text>
        <Text style={styles.subtitle}>{schedules.length} schedule(s) found</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'calendar' && styles.activeToggle]}
            onPress={() => setViewMode('calendar')}
          >
            <Text style={[styles.toggleText, viewMode === 'calendar' && styles.activeToggleText]}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>
              List
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No schedules found for this {entityType}</Text>
          <Text style={styles.emptySubtext}>Schedules will appear here once they are created</Text>
        </View>
      ) : viewMode === 'calendar' ? (
        <ImprovedCalendarView
          schedules={schedules}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      ) : (
        <ScrollView style={styles.scheduleList}>
          {schedules.map((schedule) => (
            <View key={schedule.id} style={styles.scheduleItem}>
              <View style={styles.scheduleInfo}>
                <Text style={styles.dateText}>{schedule.date}</Text>
                <Text style={styles.timeText}>
                  {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                </Text>
                {entityType !== 'student' && (
                  <Text style={styles.participantText}>Student: {schedule.student_name}</Text>
                )}
                {entityType !== 'cfi' && (
                  <Text style={styles.participantText}>CFI: {schedule.cfi_name}</Text>
                )}
                {entityType !== 'aircraft' && (
                  <Text style={styles.participantText}>Aircraft: {schedule.aircraft_tail}</Text>
                )}
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                  <Text style={styles.statusText}>{schedule.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  header: { padding: 20, paddingTop: 40, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  controls: { padding: 15, alignItems: 'center' },
  viewToggle: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 8, padding: 2 },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  activeToggle: { backgroundColor: '#007AFF' },
  toggleText: { fontSize: 14, color: '#666' },
  activeToggleText: { color: 'white', fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  scheduleList: { flex: 1, padding: 15 },
  scheduleItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  scheduleInfo: { flex: 1 },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timeText: { fontSize: 14, color: '#666', marginTop: 2 },
  participantText: { fontSize: 12, color: '#888', marginTop: 2 },
  statusContainer: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' }
});