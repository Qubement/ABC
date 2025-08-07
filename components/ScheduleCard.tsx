import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScheduleCardProps {
  date: string;
  time: string;
  instructor?: string;
  student?: string;
  aircraft?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  onPress?: () => void;
}

export default function ScheduleCard({ 
  date, 
  time, 
  instructor, 
  student, 
  aircraft, 
  status, 
  onPress 
}: ScheduleCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'scheduled': return '#007AFF';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#007AFF';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'scheduled': return 'time-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'time-outline';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Ionicons name={getStatusIcon()} size={16} color="white" />
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        {instructor && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Instructor: {instructor}</Text>
          </View>
        )}
        {student && (
          <View style={styles.detailRow}>
            <Ionicons name="school-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Student: {student}</Text>
          </View>
        )}
        {aircraft && (
          <View style={styles.detailRow}>
            <Ionicons name="airplane-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Aircraft: {aircraft}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});