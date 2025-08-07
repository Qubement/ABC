import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '../app/context/AuthContext';

const { width } = Dimensions.get('window');

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

interface ImprovedCalendarViewProps {
  schedules: Schedule[];
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export default function ImprovedCalendarView({ 
  schedules, 
  onDateSelect, 
  selectedDate 
}: ImprovedCalendarViewProps) {
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

  const getStatusDots = (daySchedules: Schedule[]) => {
    const statusCounts = daySchedules.reduce((acc, schedule) => {
      acc[schedule.status] = (acc[schedule.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).slice(0, 3).map(([status, count]) => (
      <View
        key={status}
        style={[
          styles.statusDot,
          { backgroundColor: getStatusColor(status) }
        ]}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA726';
      case 'approved': return '#66BB6A';
      case 'completed': return '#42A5F5';
      case 'canceled': return '#EF5350';
      default: return '#BDBDBD';
    }
  };

  const formatDateString = (day: number) => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentMonth);

  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
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

        <View style={styles.dayHeaders}>
          {dayNames.map(dayName => (
            <Text key={dayName} style={styles.dayHeader}>
              {dayName}
            </Text>
          ))}
        </View>

        <View style={styles.calendar}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={index} style={styles.emptyDay} />;
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
                <View style={styles.statusDotsContainer}>
                  {getStatusDots(daySchedules)}
                </View>
                {daySchedules.length > 3 && (
                  <Text style={styles.moreIndicator}>+{daySchedules.length - 3}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Status Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFA726' }]} />
              <Text style={styles.legendText}>Pending</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#66BB6A' }]} />
              <Text style={styles.legendText}>Approved</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#42A5F5' }]} />
              <Text style={styles.legendText}>Completed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF5350' }]} />
              <Text style={styles.legendText}>Canceled</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  container: { backgroundColor: 'white', borderRadius: 16, margin: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 8 },
  navButton: { padding: 12, borderRadius: 8, backgroundColor: '#f0f0f0' },
  navButtonText: { fontSize: 20, color: '#007AFF', fontWeight: '600' },
  monthTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', letterSpacing: 0.5 },
  dayHeaders: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#666', paddingVertical: 8 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  emptyDay: { width: (width - 72) / 7, height: 48 },
  dayCell: { width: (width - 72) / 7, height: 48, justifyContent: 'center', alignItems: 'center', position: 'relative', borderRadius: 8, margin: 1 },
  selectedDay: { backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  today: { borderWidth: 2, borderColor: '#FFA726', backgroundColor: '#FFF8E1' },
  dayText: { fontSize: 15, color: '#333', fontWeight: '500' },
  selectedDayText: { color: 'white', fontWeight: '700' },
  todayText: { fontWeight: '700', color: '#FF8F00' },
  statusDotsContainer: { position: 'absolute', bottom: 4, flexDirection: 'row', gap: 2 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  moreIndicator: { position: 'absolute', top: 2, right: 2, fontSize: 8, color: '#666', fontWeight: '600' },
  legend: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  legendTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', minWidth: '45%' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 13, color: '#666', fontWeight: '500' }
});