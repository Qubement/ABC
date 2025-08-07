import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import UnifiedSchedulingSystem from '../../components/UnifiedSchedulingSystem';
import NewScheduleManager from '../../components/NewScheduleManager';
import EnhancedCalendarView from '../../components/EnhancedCalendarView';
import AdminScheduleManager from '../../components/AdminScheduleManager';
import RolePermissionValidator from '../../components/RolePermissionValidator';

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

export default function Schedule() {
  const { userRole, userId } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);

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

      query = query.order('date', { ascending: true }).order('start_time', { ascending: true });

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

  const handleScheduleSelect = (schedule: Schedule) => {
    if (canEditSchedule(schedule)) {
      setEditingSchedule(schedule);
      setShowNewSchedule(true);
    }
  };

  const canEditSchedule = (schedule: Schedule) => {
    if (userRole === 'administrator') return true;
    if (userRole === 'instructor' && schedule.cfi_id === userId) return true;
    if (userRole === 'student' && schedule.student_id === userId && schedule.status === 'pending') return true;
    return false;
  };

  const canCreateSchedule = () => {
    return userRole === 'administrator' || userRole === 'instructor' || userRole === 'student';
  };

  const getHeaderColor = () => {
    switch (userRole) {
      case 'administrator': return '#007AFF';
      case 'instructor': return '#4ECDC4';
      case 'student': return '#45B7D1';
      default: return '#007AFF';
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'administrator': return 'Master Schedule';
      case 'instructor': return 'My CFI Schedule';
      case 'student': return 'My Lessons';
      default: return 'Schedule';
    }
  };

  const handleNewScheduleClose = () => {
    setShowNewSchedule(false);
    setEditingSchedule(null);
  };

  const handleScheduleCreated = () => {
    loadSchedules();
    handleNewScheduleClose();
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
      <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
        <Text style={styles.title}>{getRoleTitle()}</Text>
        <Text style={styles.subtitle}>{userRole?.charAt(0).toUpperCase() + userRole?.slice(1)} View</Text>
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

        {canCreateSchedule() && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: getHeaderColor() }]}
            onPress={() => setShowNewSchedule(true)}
          >
            <Text style={styles.addButtonText}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {viewMode === 'calendar' ? (
        <>
          <EnhancedCalendarView
            schedules={schedules}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate}
            onScheduleSelect={handleScheduleSelect}
          />
          {userRole === 'administrator' && (
            <AdminScheduleManager
              selectedDate={selectedDate}
              schedules={schedules}
              onScheduleUpdate={loadSchedules}
              onCreateSchedule={() => setShowNewSchedule(true)}
            />
          )}
        </>
      ) : (
        <View style={styles.listPlaceholder}>
          <Text style={styles.placeholderText}>List view coming soon...</Text>
        </View>
      )}

      <NewScheduleManager
        visible={showNewSchedule}
        onClose={handleNewScheduleClose}
        onScheduleCreated={handleScheduleCreated}
        editingSchedule={editingSchedule}
        selectedDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  header: { padding: 30, paddingTop: 50, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  viewToggle: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 8, padding: 2 },
  toggleButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  activeToggle: { backgroundColor: '#007AFF' },
  toggleText: { fontSize: 14, color: '#666' },
  activeToggleText: { color: 'white', fontWeight: '600' },
  addButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  listPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, color: '#666' }
});