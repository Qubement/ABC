import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '../app/context/AuthContext';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

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

interface EnhancedCalendarViewProps {
  schedules: Schedule[];
  onDateSelect: (date: string) => void;
  selectedDate: string;
  onScheduleSelect?: (schedule: Schedule) => void;
}

export default function EnhancedCalendarView({ 
  schedules, 
  onDateSelect, 
  selectedDate,
  onScheduleSelect 
}: EnhancedCalendarViewProps) {
  const { userRole } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
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

  const getSchedulesForDate = (day: number) => {
    if (!day) return [];
    const dateString = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedules.filter(schedule => schedule.date === dateString);
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatDateString = (day: number) => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentMonth);

  const cellSize = isTablet ? (width - 80) / 7 : (width - 40) / 7;

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {dayNames.map(dayName => (
            <View key={dayName} style={[styles.dayHeaderCell, { width: cellSize }]}>
              <Text style={styles.dayHeader}>{dayName}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendar}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={index} style={[styles.emptyDay, { width: cellSize, height: cellSize }]} />;
            }

            const dateString = formatDateString(day);
            const daySchedules = getSchedulesForDate(day);
            const isSelected = selectedDate === dateString;
            const isToday = dateString === new Date().toISOString().split('T')[0];

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  { width: cellSize, height: cellSize },
                  isSelected && styles.selectedDay,
                  isToday && styles.today
                ]}
                onPress={() => onDateSelect(dateString)}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.selectedDayText,
                  isToday && styles.todayText
                ]}>
                  {day}
                </Text>
                
                {/* Status Indicators */}
                <View style={styles.statusContainer}>
                  {daySchedules.slice(0, 3).map((schedule, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: getStatusColor(schedule.status) }
                      ]}
                    />
                  ))}
                  {daySchedules.length > 3 && (
                    <Text style={styles.moreText}>+{daySchedules.length - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Date Details */}
        {selectedDate && (
          <View style={styles.selectedDateDetails}>
            <Text style={styles.selectedDateTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            {getSchedulesForDate(parseInt(selectedDate.split('-')[2])).map(schedule => (
              <TouchableOpacity
                key={schedule.id}
                style={[styles.scheduleItem, { borderLeftColor: getStatusColor(schedule.status) }]}
                onPress={() => onScheduleSelect?.(schedule)}
              >
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTime}>
                    {schedule.start_time} - {schedule.end_time}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                    <Text style={styles.statusText}>{schedule.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.scheduleDetails}>
                  Student: {schedule.student_name} | CFI: {schedule.cfi_name}
                </Text>
                <Text style={styles.scheduleDetails}>
                  Aircraft: {schedule.aircraft_tail}
                </Text>
                {userRole === 'administrator' && (
                  <Text style={styles.adminHint}>Tap to manage as Admin</Text>
                )}
              </TouchableOpacity>
            ))}
            {getSchedulesForDate(parseInt(selectedDate.split('-')[2])).length === 0 && (
              <Text style={styles.noSchedulesText}>No schedules for this date</Text>
            )}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Status Legend</Text>
          <View style={styles.legendGrid}>
            {[
              { status: 'pending', label: 'Pending', color: '#FF9800' },
              { status: 'approved', label: 'Approved', color: '#4CAF50' },
              { status: 'completed', label: 'Completed', color: '#2196F3' },
              { status: 'canceled', label: 'Canceled', color: '#F44336' }
            ].map(item => (
              <View key={item.status} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { backgroundColor: 'white', borderRadius: 12, margin: 12, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  navButton: { padding: 8, borderRadius: 6, backgroundColor: '#f0f2f5', minWidth: 36, alignItems: 'center' },
  navButtonText: { fontSize: 20, color: '#007AFF', fontWeight: '600' },
  monthTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', letterSpacing: 0.3 },
  dayHeaders: { flexDirection: 'row', marginBottom: 6 },
  dayHeaderCell: { alignItems: 'center', paddingVertical: 6 },
  dayHeader: { fontSize: 11, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyDay: {},
  dayCell: { justifyContent: 'space-between', alignItems: 'center', padding: 3, borderRadius: 6, margin: 0.5, position: 'relative' },
  selectedDay: { backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  today: { borderWidth: 2, borderColor: '#FF9800', backgroundColor: '#FFF8E1' },
  dayText: { fontSize: 12, color: '#333', fontWeight: '500', textAlign: 'center' },
  selectedDayText: { color: 'white', fontWeight: '700' },
  todayText: { fontWeight: '700', color: '#FF8F00' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  statusIndicator: { width: 3, height: 3, borderRadius: 1.5, marginRight: 1 },
  moreText: { fontSize: 7, color: '#666', fontWeight: '600' },
  selectedDateDetails: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  selectedDateTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10, color: '#333' },
  scheduleItem: { backgroundColor: '#f8f9fa', borderRadius: 6, padding: 10, marginBottom: 6, borderLeftWidth: 3 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  scheduleTime: { fontSize: 13, fontWeight: '600', color: '#333' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 9, color: 'white', fontWeight: '600' },
  scheduleDetails: { fontSize: 11, color: '#666', marginBottom: 1 },
  adminHint: { fontSize: 10, color: '#007AFF', fontStyle: 'italic', marginTop: 3 },
  noSchedulesText: { fontSize: 13, color: '#999', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  legend: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  legendTitle: { fontSize: 13, fontWeight: '600', marginBottom: 10, color: '#333' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', minWidth: '45%' },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  legendText: { fontSize: 11, color: '#666', fontWeight: '500' }
});