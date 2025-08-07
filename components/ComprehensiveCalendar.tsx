import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface Schedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  student_id?: string;
  instructor_id?: string;
  aircraft_id?: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
}

interface CalendarProps {
  userRole: 'student' | 'cfi' | 'instructor' | 'administrator';
  userId: string;
  onScheduleSelect?: (schedule: Schedule) => void;
}

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 32) / 7;

export default function ComprehensiveCalendar({ userRole, userId, onScheduleSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, userId]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      let query = supabase
        .from('schedules')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      // Role-based filtering
      if (userRole === 'student') {
        query = query.eq('student_id', userId);
      } else if (userRole === 'cfi' || userRole === 'instructor') {
        query = query.or(`instructor_id.eq.${userId},cfi_id.eq.${userId}`);
      }
      // Admin sees all schedules

      const { data, error } = await query.order('date').order('start_time');
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50'; // Green
      case 'pending': return '#FF9800'; // Orange/Yellow
      case 'cancelled': return '#f44336'; // Red
      case 'completed': return '#2196F3'; // Blue
      default: return '#666';
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const getSchedulesForDate = (day: number) => {
    const dateStr = getDateString(day);
    return schedules.filter(s => s.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate('');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDateSchedules = selectedDate ? 
    schedules.filter(s => s.date === selectedDate) : [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {userRole === 'administrator' ? 'All Schedules' : 
         userRole === 'cfi' ? 'CFI Schedule' :
         userRole === 'instructor' ? 'Teaching Schedule' : 'My Schedule'}
      </Text>
      
      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {dayNames.map(day => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeader}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {getDaysInMonth().map((day, index) => {
          const daySchedules = day ? getSchedulesForDate(day) : [];
          const isSelected = selectedDate === (day ? getDateString(day) : '');
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDay
              ]}
              onPress={() => day && setSelectedDate(getDateString(day))}
              disabled={!day}
            >
              {day && (
                <View style={styles.dayCellContent}>
                  <Text style={[styles.dayNumber, isSelected && styles.selectedDayText]}>
                    {day}
                  </Text>
                  {daySchedules.length > 0 && (
                    <View style={styles.statusIndicators}>
                      {daySchedules.slice(0, 3).map((schedule, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(schedule.status) }
                          ]}
                        />
                      ))}
                      {daySchedules.length > 3 && (
                        <Text style={styles.moreIndicator}>+{daySchedules.length - 3}</Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Schedule Details for Selected Date */}
      {selectedDate && (
        <View style={styles.scheduleDetails}>
          <Text style={styles.detailsTitle}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}
          </Text>
          {selectedDateSchedules.length === 0 ? (
            <Text style={styles.noSchedules}>No schedules for this date</Text>
          ) : (
            selectedDateSchedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={[
                  styles.scheduleItem,
                  { borderLeftColor: getStatusColor(schedule.status) }
                ]}
                onPress={() => onScheduleSelect?.(schedule)}
              >
                <View style={styles.scheduleHeader}>
                  <Text style={styles.timeText}>
                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                  </Text>
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(schedule.status) }
                  ]}>
                    {schedule.status.toUpperCase()}
                  </Text>
                </View>
                {schedule.notes && (
                  <Text style={styles.notesText}>{schedule.notes}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
      
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', paddingHorizontal: 16, paddingTop: 16 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  navButton: { padding: 8, borderRadius: 4 },
  navButtonText: { fontSize: 24, color: '#007AFF', fontWeight: 'bold' },
  monthTitle: { fontSize: 18, fontWeight: '600' },
  dayHeaders: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 16 },
  dayHeaderCell: { width: CELL_SIZE, alignItems: 'center' },
  dayHeader: { fontWeight: '600', color: '#666', fontSize: 12 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, paddingHorizontal: 16 },
  dayCell: { width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: 'white' },
  dayCellContent: { alignItems: 'center' },
  selectedDay: { backgroundColor: '#007AFF' },
  dayNumber: { fontSize: 16, fontWeight: '500' },
  selectedDayText: { color: 'white' },
  statusIndicators: { flexDirection: 'row', marginTop: 2, alignItems: 'center' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 1 },
  moreIndicator: { fontSize: 8, color: '#666', marginLeft: 2 },
  scheduleDetails: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  detailsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  noSchedules: { textAlign: 'center', color: '#666', fontStyle: 'italic', paddingVertical: 20 },
  scheduleItem: { padding: 12, marginBottom: 8, borderRadius: 6, backgroundColor: '#f9f9f9', borderLeftWidth: 4 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 14, fontWeight: '500' },
  statusText: { fontSize: 12, fontWeight: '600' },
  notesText: { fontSize: 12, color: '#666', marginTop: 4 },
  loadingContainer: { padding: 20, alignItems: 'center' },
  loadingText: { color: '#666', fontStyle: 'italic' }
});