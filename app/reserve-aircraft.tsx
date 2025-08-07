import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from './lib/supabase';

interface Aircraft {
  id: string;
  tail_number: string;
  make: string;
  model: string;
  status: string;
}

export default function ReserveAircraft() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const dates = [
    'Today', 'Tomorrow', 'Dec 17', 'Dec 18', 'Dec 19'
  ];

  useEffect(() => {
    fetchAircraft();
  }, []);

  const fetchAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('status', 'available');
      
      if (error) throw error;
      setAircraft(data || []);
    } catch (error) {
      console.error('Error fetching aircraft:', error);
      Alert.alert('Error', 'Failed to load aircraft');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (aircraftId: string, tailNumber: string) => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select both date and time');
      return;
    }

    Alert.alert(
      'Confirm Reservation',
      `Reserve ${tailNumber} on ${selectedDate} at ${selectedTime}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reserve', onPress: () => confirmReservation(aircraftId, tailNumber) }
      ]
    );
  };

  const confirmReservation = async (aircraftId: string, tailNumber: string) => {
    Alert.alert('Success', `${tailNumber} reserved for ${selectedDate} at ${selectedTime}`);
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Reserve Aircraft</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[styles.dateButton, selectedDate === date && styles.selectedButton]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateText, selectedDate === date && styles.selectedText]}>
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[styles.timeButton, selectedTime === time && styles.selectedButton]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[styles.timeText, selectedTime === time && styles.selectedText]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Aircraft</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading aircraft...</Text>
        ) : aircraft.length === 0 ? (
          <Text style={styles.noDataText}>No aircraft available</Text>
        ) : (
          <View>
            {aircraft.map((plane) => (
              <View key={plane.id} style={styles.aircraftCard}>
                <View style={styles.aircraftInfo}>
                  <Text style={styles.tailNumber}>{plane.tail_number}</Text>
                  <Text style={styles.aircraftModel}>{plane.make} {plane.model}</Text>
                  <Text style={styles.status}>Status: {plane.status}</Text>
                </View>
                <TouchableOpacity
                  style={styles.reserveButton}
                  onPress={() => handleReserve(plane.id, plane.tail_number)}
                >
                  <Text style={styles.reserveButtonText}>Reserve</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedButton: {
    backgroundColor: '#45B7D1',
    borderColor: '#45B7D1',
  },
  dateText: {
    color: '#333',
    fontWeight: '600',
  },
  selectedText: {
    color: 'white',
  },
  timeButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeText: {
    color: '#333',
    fontWeight: '600',
  },
  aircraftCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  aircraftInfo: {
    flex: 1,
  },
  tailNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  aircraftModel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  status: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  reserveButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
  },
  reserveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
});