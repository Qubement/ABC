import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import { router } from 'expo-router';
import RollerPickerModal from './RollerPickerModal';
import { TicketService } from './TicketService';

export default function RequestLessonFormWithTickets() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCFI, setSelectedCFI] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableCFIs, setAvailableCFIs] = useState<{id: string, name: string}[]>([]);
  const [availableAircraft, setAvailableAircraft] = useState<{id: string, name: string, scheduleId: string}[]>([]);
  
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCFIModal, setShowCFIModal] = useState(false);
  const [showAircraftModal, setShowAircraftModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCurrentUser();
    loadAvailableDates();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
      Alert.alert('Error', 'Please log in to request lessons');
    }
  };

  const loadAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('date')
        .eq('is_available', true);
      
      if (error) throw error;
      const dates = [...new Set(data?.map(d => d.date) || [])];
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error loading dates:', error);
    }
  };

  const loadAvailableTimes = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('start_time')
        .eq('date', date)
        .eq('is_available', true);
      
      if (error) throw error;
      const times = [...new Set(data?.map(d => d.start_time) || [])];
      setAvailableTimes(times);
    } catch (error) {
      console.error('Error loading times:', error);
    }
  };

  const loadAvailableCFIs = async (date: string, time: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('cfi_id, cfis(name)')
        .eq('date', date)
        .eq('start_time', time)
        .eq('is_available', true);
      
      if (error) throw error;
      const cfis = data?.map(d => ({id: d.cfi_id, name: d.cfis?.name || ''})) || [];
      setAvailableCFIs(cfis);
    } catch (error) {
      console.error('Error loading CFIs:', error);
    }
  };

  const loadAvailableAircraft = async (date: string, time: string, cfiId: string) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('id, aircraft_id, aircraft(tail_number)')
        .eq('date', date)
        .eq('start_time', time)
        .eq('cfi_id', cfiId)
        .eq('is_available', true);
      
      if (error) throw error;
      const aircraft = data?.map(d => ({
        id: d.aircraft_id, 
        name: d.aircraft?.tail_number || '',
        scheduleId: d.id
      })) || [];
      setAvailableAircraft(aircraft);
    } catch (error) {
      console.error('Error loading aircraft:', error);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setSelectedCFI('');
    setSelectedAircraft('');
    setSelectedScheduleId('');
    loadAvailableTimes(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSelectedCFI('');
    setSelectedAircraft('');
    setSelectedScheduleId('');
    loadAvailableCFIs(selectedDate, time);
  };

  const handleCFISelect = (cfiId: string) => {
    setSelectedCFI(cfiId);
    setSelectedAircraft('');
    setSelectedScheduleId('');
    loadAvailableAircraft(selectedDate, selectedTime, cfiId);
  };

  const handleAircraftSelect = (aircraftId: string) => {
    setSelectedAircraft(aircraftId);
    const aircraft = availableAircraft.find(a => a.id === aircraftId);
    if (aircraft) {
      setSelectedScheduleId(aircraft.scheduleId);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedCFI || !selectedAircraft || !currentUser) {
      Alert.alert('Error', 'Please select all fields and ensure you are logged in');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (!selectedScheduleId) {
        throw new Error('Schedule ID is required');
      }

      const startTime = new Date(`2000-01-01T${selectedTime}`);
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start time format');
      }
      
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      const requestData = {
        student_id: currentUser.id,
        cfi_id: selectedCFI,
        aircraft_id: selectedAircraft,
        requested_date: selectedDate,
        requested_start_time: selectedTime,
        requested_end_time: endTimeString,
        schedule_id: selectedScheduleId,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('lesson_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      // Generate ticket number for confirmation
      const ticketNumber = TicketService.generateTicketNumber(data.id);
      
      Alert.alert(
        'Success', 
        `Lesson request ticket ${ticketNumber} sent to CFI for verification!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Submit error:', error);
      const errorMessage = error.message || 'Failed to submit request. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Request Lesson Ticket</Text>
      </View>

      <View style={styles.buttonColumn}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => availableDates.length > 0 && setShowDateModal(true)}
        >
          <Text style={styles.buttonText}>
            {selectedDate || (availableDates.length > 0 ? 'Select Date' : 'No dates available')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !selectedDate && styles.disabledButton]} 
          onPress={() => selectedDate && availableTimes.length > 0 && setShowTimeModal(true)}
          disabled={!selectedDate}
        >
          <Text style={styles.buttonText}>
            {selectedTime || (selectedDate && availableTimes.length > 0 ? 'Select Time' : 'Select Date First')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !selectedTime && styles.disabledButton]} 
          onPress={() => selectedTime && availableCFIs.length > 0 && setShowCFIModal(true)}
          disabled={!selectedTime}
        >
          <Text style={styles.buttonText}>
            {selectedCFI ? availableCFIs.find(c => c.id === selectedCFI)?.name : 
             (selectedTime && availableCFIs.length > 0 ? 'Select CFI' : 'Select Time First')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !selectedCFI && styles.disabledButton]} 
          onPress={() => selectedCFI && availableAircraft.length > 0 && setShowAircraftModal(true)}
          disabled={!selectedCFI}
        >
          <Text style={styles.buttonText}>
            {selectedAircraft ? availableAircraft.find(a => a.id === selectedAircraft)?.name : 
             (selectedCFI && availableAircraft.length > 0 ? 'Select Aircraft' : 'Select CFI First')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitButton, (isSubmitting || !selectedAircraft) && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedAircraft}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Generating Ticket...' : 'Submit Request Ticket'}
          </Text>
        </TouchableOpacity>
      </View>

      <RollerPickerModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        items={availableDates.map(date => ({ label: date, value: date }))}
        onSelect={handleDateSelect}
        title="Select Date"
        selectedValue={selectedDate}
      />

      <RollerPickerModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        items={availableTimes.map(time => ({ label: time, value: time }))}
        onSelect={handleTimeSelect}
        title="Select Time"
        selectedValue={selectedTime}
      />

      <RollerPickerModal
        visible={showCFIModal}
        onClose={() => setShowCFIModal(false)}
        items={availableCFIs.map(cfi => ({ label: cfi.name, value: cfi.id }))}
        onSelect={handleCFISelect}
        title="Select CFI"
        selectedValue={selectedCFI}
      />

      <RollerPickerModal
        visible={showAircraftModal}
        onClose={() => setShowAircraftModal(false)}
        items={availableAircraft.map(aircraft => ({ label: aircraft.name, value: aircraft.id }))}
        onSelect={handleAircraftSelect}
        title="Select Aircraft"
        selectedValue={selectedAircraft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15
  },
  buttonColumn: {
    padding: 20,
    gap: 15
  },
  button: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center'
  },
  submitButton: {
    backgroundColor: '#45B7D1',
    padding: 20,
    borderRadius: 10,
    marginTop: 20
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});