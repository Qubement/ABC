import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import { router } from 'expo-router';
import RollerPickerModal from './RollerPickerModal';
import { styles } from './RequestLessonFormStyles';

export default function RequestLessonFormFinal() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCFI, setSelectedCFI] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableCFIs, setAvailableCFIs] = useState<{id: string, name: string}[]>([]);
  const [availableAircraft, setAvailableAircraft] = useState<{id: string, name: string}[]>([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showCFIModal, setShowCFIModal] = useState(false);
  const [showAircraftModal, setShowAircraftModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    getCurrentUser();
    loadData();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        Alert.alert('Error', 'Please log in to request lessons');
        return;
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
      Alert.alert('Error', 'Authentication failed. Please log in again.');
    }
  };

  const loadData = async () => {
    try {
      const dates = [];
      const today = new Date();
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      setAvailableDates(dates);
      setAvailableTimes(['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']);

      const { data: cfis, error: cfiError } = await supabase.from('cfis').select('id, name');
      if (cfiError) throw cfiError;
      setAvailableCFIs(cfis || []);

      const { data: aircraft, error: aircraftError } = await supabase.from('aircraft').select('id, tail_number, model');
      if (aircraftError) throw aircraftError;
      setAvailableAircraft(aircraft?.map(a => ({ id: a.id, name: `${a.tail_number} (${a.model})` })) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load form data. Please try again.');
    }
  };

  const generateTicketNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `LR${timestamp}${random}`;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedCFI || !selectedAircraft) {
      Alert.alert('Error', 'Please select all fields');
      return;
    }
    
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to request lessons');
      return;
    }
    
    setIsSubmitting(true);
    setShowVerificationModal(true);
    setVerificationStatus('Step 1: Validating request data...');
    setVerificationError('');
    setIsSuccess(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(selectedTime)) {
        throw new Error('Invalid time format');
      }
      
      const startTime = new Date(`2000-01-01T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      setVerificationStatus('Step 2: Creating lesson request...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const requestData = {
        student_id: currentUser.id,
        cfi_id: selectedCFI,
        aircraft_id: selectedAircraft,
        requested_date: selectedDate,
        requested_start_time: selectedTime,
        requested_end_time: endTimeString,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data: lessonRequest, error: requestError } = await supabase
        .from('lesson_requests')
        .insert(requestData)
        .select()
        .single();

      if (requestError) {
        throw new Error(`Database error: ${requestError.message}`);
      }

      if (!lessonRequest) {
        throw new Error('Failed to create lesson request - no data returned');
      }

      setVerificationStatus('Step 3: Generating ticket...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTicketNumber = generateTicketNumber();
      
      setVerificationStatus('Step 4: Storing ticket...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ticketData = {
        ticket_number: newTicketNumber,
        lesson_request_id: lessonRequest.id,
        student_id: currentUser.id,
        cfi_id: selectedCFI,
        aircraft_id: selectedAircraft,
        status: 'pending',
        created_at: new Date().toISOString(),
        ticket_data: {
          requestedDate: selectedDate,
          requestedTime: `${selectedTime} - ${endTimeString}`,
          createdAt: new Date().toISOString(),
          studentEmail: currentUser.email
        }
      };

      const { error: ticketError } = await supabase
        .from('lesson_tickets')
        .insert(ticketData);

      if (ticketError) {
        throw new Error(`Ticket creation failed: ${ticketError.message}`);
      }

      setVerificationStatus(`✅ REQUEST SENT! Ticket ${newTicketNumber} generated successfully.`);
      setIsSuccess(true);
      
      setTimeout(() => {
        setShowVerificationModal(false);
        router.back();
      }, 3000);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      setVerificationError(`❌ SEND FAILED: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowVerificationModal(false);
    if (isSuccess) {
      router.back();
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
        <TouchableOpacity style={styles.button} onPress={() => setShowDateModal(true)}>
          <Text style={styles.buttonText}>{selectedDate || 'Select Date'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, !selectedDate && styles.disabledButton]} onPress={() => selectedDate && setShowTimeModal(true)} disabled={!selectedDate}>
          <Text style={styles.buttonText}>{selectedTime || 'Select Time'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, !selectedTime && styles.disabledButton]} onPress={() => selectedTime && setShowCFIModal(true)} disabled={!selectedTime}>
          <Text style={styles.buttonText}>{selectedCFI ? availableCFIs.find(c => c.id === selectedCFI)?.name : 'Select CFI'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, !selectedCFI && styles.disabledButton]} onPress={() => selectedCFI && setShowAircraftModal(true)} disabled={!selectedCFI}>
          <Text style={styles.buttonText}>{selectedAircraft ? availableAircraft.find(a => a.id === selectedAircraft)?.name : 'Select Aircraft'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitButton, (isSubmitting || !selectedAircraft) && styles.disabledButton]} onPress={handleSubmit} disabled={isSubmitting || !selectedAircraft}>
          <Text style={styles.submitText}>{isSubmitting ? 'Processing...' : 'Send Request'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showVerificationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Verification</Text>
            {!verificationError && !isSuccess && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color="#45B7D1" />
                <Text style={styles.statusText}>{verificationStatus}</Text>
              </View>
            )}
            {isSuccess && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
                <Text style={styles.successText}>{verificationStatus}</Text>
              </View>
            )}
            {verificationError && (
              <View style={styles.errorContainer}>
                <Ionicons name="close-circle" size={50} color="#f44336" />
                <Text style={styles.errorText}>{verificationError}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <RollerPickerModal visible={showDateModal} onClose={() => setShowDateModal(false)} items={availableDates.map(date => ({ label: date, value: date }))} onSelect={setSelectedDate} title="Select Date" selectedValue={selectedDate} />
      <RollerPickerModal visible={showTimeModal} onClose={() => setShowTimeModal(false)} items={availableTimes.map(time => ({ label: time, value: time }))} onSelect={setSelectedTime} title="Select Time" selectedValue={selectedTime} />
      <RollerPickerModal visible={showCFIModal} onClose={() => setShowCFIModal(false)} items={availableCFIs.map(cfi => ({ label: cfi.name, value: cfi.id }))} onSelect={setSelectedCFI} title="Select CFI" selectedValue={selectedCFI} />
      <RollerPickerModal visible={showAircraftModal} onClose={() => setShowAircraftModal(false)} items={availableAircraft.map(aircraft => ({ label: aircraft.name, value: aircraft.id }))} onSelect={setSelectedAircraft} title="Select Aircraft" selectedValue={selectedAircraft} />
    </View>
  );
}