import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';
import CFIScheduleModal from './CFIScheduleModal';
import StudentScheduleModal from './StudentScheduleModal';
import ImprovedCalendarView from './ImprovedCalendarView';
interface Schedule {
  id: string;
  entity_type: string;
  entity_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ScheduleManagerProps {
  entityType: 'aircraft' | 'cfi' | 'student';
  entityId: string;
  entityName: string;
}

export default function ScheduleManager({ entityType, entityId, entityName }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showCFIModal, setShowCFIModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    fetchSchedules();
  }, [entityId]);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const toggleAvailability = async (scheduleId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ is_available: !currentAvailability })
        .eq('id', scheduleId);
      
      if (error) throw error;
      fetchSchedules();
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  const handleScheduleCreated = () => {
    fetchSchedules();
  };

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Schedule for {entityName}</Text>
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

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <ImprovedCalendarView
          entityType={entityType}
          entityId={entityId}
          entityName={entityName}
        />
      ) : (
        /* List View */
        schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No schedule found for this {entityType}</Text>
            <TouchableOpacity
              style={[styles.createButton, entityType === 'student' && styles.studentButton]}
              onPress={() => {
                if (entityType === 'cfi') {
                  setShowCFIModal(true);
                } else if (entityType === 'student') {
                  setShowStudentModal(true);
                }
              }}
            >
              <Text style={styles.createButtonText}>
                Create {entityType === 'cfi' ? 'CFI' : entityType === 'student' ? 'Student' : 'Aircraft'} Schedule
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.scheduleList}>
            <TouchableOpacity
              style={[styles.addMoreButton, entityType === 'student' && styles.studentButton]}
              onPress={() => {
                if (entityType === 'cfi') {
                  setShowCFIModal(true);
                } else if (entityType === 'student') {
                  setShowStudentModal(true);
                }
              }}
            >
              <Text style={styles.createButtonText}>
                Add More {entityType === 'cfi' ? 'CFI' : entityType === 'student' ? 'Student' : 'Aircraft'} Schedule
              </Text>
            </TouchableOpacity>
            
            {schedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.dateText}>{schedule.date}</Text>
                  <Text style={styles.timeText}>
                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.availabilityButton,
                    schedule.is_available ? styles.available : styles.unavailable
                  ]}
                  onPress={() => toggleAvailability(schedule.id, schedule.is_available)}
                >
                  <Text style={styles.availabilityText}>
                    {schedule.is_available ? 'Available' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )
      )}

      {entityType === 'cfi' && (
        <CFIScheduleModal
          visible={showCFIModal}
          onClose={() => setShowCFIModal(false)}
          onScheduleCreated={handleScheduleCreated}
          selectedCFIId={entityId}
        />
      )}

      {entityType === 'student' && (
        <StudentScheduleModal
          visible={showStudentModal}
          onClose={() => setShowStudentModal(false)}
          onScheduleCreated={handleScheduleCreated}
          selectedStudentId={entityId}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerContainer: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#333', textAlign: 'center' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 4 },
  toggleButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center' },
  activeToggle: { backgroundColor: '#007AFF' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeToggleText: { color: 'white' },
  emptyState: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 20 },
  createButton: { backgroundColor: '#45B7D1', padding: 15, borderRadius: 8, alignItems: 'center', width: '100%' },
  addMoreButton: { backgroundColor: '#45B7D1', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  studentButton: { backgroundColor: '#4CAF50' },
  createButtonText: { color: 'white', fontWeight: 'bold' },
  scheduleList: { flex: 1 },
  scheduleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, marginBottom: 10, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  scheduleInfo: { flex: 1 },
  dateText: { fontSize: 16, fontWeight: '600', color: '#333' },
  timeText: { fontSize: 14, color: '#666', marginTop: 2 },
  availabilityButton: { padding: 8, borderRadius: 6, minWidth: 80, alignItems: 'center' },
  available: { backgroundColor: '#4CAF50' },
  unavailable: { backgroundColor: '#f44336' },
  availabilityText: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});