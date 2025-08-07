import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import { router } from 'expo-router';
import RollerPickerModal from './RollerPickerModal';

export default function RequestLessonForm() {
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

  const generateTicket = async (lessonRequestId: string) => {
    try {
      const ticketNumber = `LR${Date.now()}`;
      
      const { data: studentData } = await supabase
        .from('students')
        .select('name')
        .eq('id', currentUser.id)
        .single();
      
      const { data: cfiData } = await supabase
        .from('cfis')
        .select('name')
        .eq('id', selectedCFI)
        .single();
      
      const { data: aircraftData } = await supabase
        .from('aircraft')
        .select('tail_number')
        .eq('id', selectedAircraft)
        .single();
      
      const ticketData = {
        studentName: studentData?.name || 'Unknown Student',
        cfiName: cfiData?.name || 'Unknown CFI',
        aircraftInfo: aircraftData?.tail_number || 'Unknown Aircraft',
        requestedDate: selectedDate,
        requestedTime: selectedTime,
        studentMessage: 'Lesson request submitted'
      };

      const { error } = await supabase
        .from('lesson_tickets')
        .insert({
          ticket_number: ticketNumber,
          lesson_request_id: lessonRequestId,
          student_id: currentUser.id,
          cfi_id: selectedCFI,
          aircraft_id: selectedAircraft,
          status: 'pending',
          ticket_data: ticketData
        });

      if (error) throw error;
      console.log(`Ticket ${ticketNumber} generated successfully`);
    } catch (error) {
      console.error('Error generating ticket:', error);
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
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      await generateTicket(data.id);
      
      Alert.alert('Success', 'Lesson request sent and ticket generated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
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
        <Text style={styles.title}>Request Lesson</Text>
      </View>

      <View style={styles.buttonColumn}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setShowDateModal(true)}
        >
          <Text style={styles.buttonText}>
            {selectedDate || 'Select Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !selectedDate && styles.disabledButton]} 
          onPress={() => selectedDate && setShowTimeModal(true)}
          disabled={!selectedDate}
        >
          <Text style={styles.buttonText}>
            {selectedTime || 'Select Time'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !selectedTime && styles.disabledButton]} 
          onPress={() => selectedTime && setShowCFIModal(true)}
          disabled={!selectedTime}
        >
          <Text style={styles.buttonText}>
            {selectedCFI ? availableCFIs.find(c => c.id === selectedCFI)?.name : 'Select CFI'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !selectedCFI && styles.disabledButton]} 
          onPress={() => selectedCFI && setShowAircraftModal(true)}
          disabled={!selectedCFI}
        >
          <Text style={styles.buttonText}>
            {selectedAircraft ? availableAircraft.find(a => a.id === selectedAircraft)?.name : 'Select Aircraft'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitButton, (isSubmitting || !selectedAircraft) && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedAircraft}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#45B7D1', padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  buttonColumn: { padding: 20, gap: 15 },
  button: { backgroundColor: 'white', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  buttonText: { fontSize: 16, color: '#333', textAlign: 'center' },
  submitButton: { backgroundColor: '#45B7D1', padding: 20, borderRadius: 10, marginTop: 20 },
  disabledButton: { backgroundColor: '#ccc', opacity: 0.6 },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }
});