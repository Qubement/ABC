import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface Schedule {
  id: string;
  entity_type: string;
  entity_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  entity_name?: string;
}

interface ScheduleListProps {
  userRole: string;
  currentUserId?: string;
  refreshTrigger: number;
}

export default function ScheduleList({ userRole, currentUserId, refreshTrigger }: ScheduleListProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [userRole, currentUserId, refreshTrigger]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('schedules')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      // Apply role-based filtering
      if (userRole === 'student' && currentUserId) {
        query = query.eq('entity_id', currentUserId).eq('entity_type', 'student');
      } else if (userRole === 'instructor' && currentUserId) {
        query = query.or(`and(entity_type.eq.cfi,entity_id.eq.${currentUserId}),entity_type.eq.student`);
      }
      // Admin sees all schedules

      const { data, error } = await query;
      if (error) throw error;

      // Fetch entity names
      const schedulesWithNames = await Promise.all(
        (data || []).map(async (schedule) => {
          let entityName = 'Unknown';
          
          try {
            if (schedule.entity_type === 'student') {
              const { data: student } = await supabase
                .from('students')
                .select('first_name, last_name')
                .eq('id', schedule.entity_id)
                .single();
              if (student) entityName = `${student.first_name} ${student.last_name}`;
            } else if (schedule.entity_type === 'cfi') {
              const { data: cfi } = await supabase
                .from('cfis')
                .select('first_name, last_name')
                .eq('id', schedule.entity_id)
                .single();
              if (cfi) entityName = `${cfi.first_name} ${cfi.last_name}`;
            } else if (schedule.entity_type === 'aircraft') {
              const { data: aircraft } = await supabase
                .from('aircraft')
                .select('tail_number, make, model')
                .eq('id', schedule.entity_id)
                .single();
              if (aircraft) entityName = `${aircraft.tail_number} (${aircraft.make} ${aircraft.model})`;
            }
          } catch (err) {
            console.error('Error fetching entity name:', err);
          }

          return { ...schedule, entity_name: entityName };
        })
      );

      setSchedules(schedulesWithNames);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
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

  const deleteSchedule = async (scheduleId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', scheduleId);
              
              if (error) throw error;
              fetchSchedules();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete schedule');
            }
          }
        }
      ]
    );
  };

  const canModifySchedule = (schedule: Schedule) => {
    if (userRole === 'administrator') return true;
    if (userRole === 'instructor') {
      return schedule.entity_type === 'student' || 
             (schedule.entity_type === 'cfi' && schedule.entity_id === currentUserId);
    }
    return false; // Students can only view
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {schedules.length === 0 ? (
        <Text style={styles.emptyText}>No schedules found</Text>
      ) : (
        schedules.map((schedule) => (
          <View key={schedule.id} style={styles.scheduleItem}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.entityText}>
                {schedule.entity_name} ({schedule.entity_type})
              </Text>
              <Text style={styles.dateText}>{schedule.date}</Text>
              <Text style={styles.timeText}>
                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
              </Text>
            </View>
            
            <View style={styles.actions}>
              {canModifySchedule(schedule) && (
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
              )}
              
              {!canModifySchedule(schedule) && (
                <View style={[
                  styles.statusIndicator,
                  schedule.is_available ? styles.available : styles.unavailable
                ]}>
                  <Text style={styles.statusText}>
                    {schedule.is_available ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              )}
              
              {canModifySchedule(schedule) && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteSchedule(schedule.id)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  scheduleItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  scheduleInfo: {
    marginBottom: 10,
  },
  entityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  statusIndicator: {
    padding: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  available: {
    backgroundColor: '#4CAF50',
  },
  unavailable: {
    backgroundColor: '#f44336',
  },
  availabilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
