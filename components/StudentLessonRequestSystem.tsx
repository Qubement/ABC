import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import AutoAuthProvider from './AutoAuthProvider';

interface CFI {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Aircraft {
  id: string;
  tail_number: string;
  make: string;
  model: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

function StudentLessonRequestSystemContent() {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCFI, setSelectedCFI] = useState<CFI | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [cfis, setCfis] = useState<CFI[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    if (isAuthenticated) {
      loadCFIs();
      loadAircraft();
      loadStudents();
    }
  }, [isAuthenticated]);

  const loadCFIs = async () => {
    try {
      const { data, error } = await supabase.from('cfis').select('id, first_name, last_name, email').eq('status', 'active');
      if (error) throw error;
      setCfis(data || []);
    } catch (error) {
      console.error('Error loading CFIs:', error);
    }
  };

  const loadAircraft = async () => {
    try {
      const { data, error } = await supabase.from('aircraft').select('id, tail_number, make, model').eq('status', 'active');
      if (error) throw error;
      setAircraft(data || []);
    } catch (error) {
      console.error('Error loading aircraft:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase.from('students').select('id, first_name, last_name, email').eq('status', 'active');
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const generateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const submitRequest = async () => {
    if (!selectedDate || !selectedTime || !selectedCFI || !selectedAircraft || !selectedStudent) {
      Alert.alert('Error', 'Please complete all selections');
      return;
    }

    setLoading(true);
    try {
      const endTime = generateEndTime(selectedTime);
      
      const { data: lessonRequest, error: requestError } = await supabase
        .from('lesson_requests')
        .insert({
          student_id: selectedStudent.id,
          cfi_id: selectedCFI.id,
          aircraft_id: selectedAircraft.id,
          requested_date: selectedDate,
          requested_start_time: selectedTime,
          requested_end_time: endTime,
          status: 'pending',
          student_message: 'Lesson request submitted via system'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      const ticketNumber = `TKT-${Date.now()}`;
      const { error: ticketError } = await supabase
        .from('lesson_tickets')
        .insert({
          lesson_request_id: lessonRequest.id,
          ticket_number: ticketNumber,
          status: 'pending',
          cfi_id: selectedCFI.id
        });

      if (ticketError) throw ticketError;

      Alert.alert('Success', `Lesson request submitted! Ticket: ${ticketNumber}`);
      resetForm();
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit lesson request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedCFI(null);
    setSelectedAircraft(null);
    setSelectedStudent(null);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Authenticating...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Lesson Request System</Text>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Step {step} of 6</Text>
      </View>
      <ScrollView style={styles.content}>
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Step 1: Select Student</Text>
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[styles.optionCard, selectedStudent?.id === student.id && styles.selectedOption]}
                onPress={() => setSelectedStudent(student)}
              >
                <Text style={styles.optionText}>{student.first_name} {student.last_name}</Text>
                <Text style={styles.optionSubtext}>{student.email}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Step 2: Select Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={selectedDate}
              onChangeText={setSelectedDate}
            />
          </View>
        )}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Step 3: Select Time</Text>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.optionCard, selectedTime === time && styles.selectedOption]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={styles.optionText}>{time} - {generateEndTime(time)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Step 4: Select CFI</Text>
            {cfis.map((cfi) => (
              <TouchableOpacity
                key={cfi.id}
                style={[styles.optionCard, selectedCFI?.id === cfi.id && styles.selectedOption]}
                onPress={() => setSelectedCFI(cfi)}
              >
                <Text style={styles.optionText}>{cfi.first_name} {cfi.last_name}</Text>
                <Text style={styles.optionSubtext}>{cfi.email}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>Step 5: Select Aircraft</Text>
            {aircraft.map((ac) => (
              <TouchableOpacity
                key={ac.id}
                style={[styles.optionCard, selectedAircraft?.id === ac.id && styles.selectedOption]}
                onPress={() => setSelectedAircraft(ac)}
              >
                <Text style={styles.optionText}>{ac.tail_number}</Text>
                <Text style={styles.optionSubtext}>{ac.make} {ac.model}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {step === 6 && (
          <View>
            <Text style={styles.stepTitle}>Review & Submit</Text>
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewText}>Student: {selectedStudent?.first_name} {selectedStudent?.last_name}</Text>
              <Text style={styles.reviewText}>Date: {selectedDate}</Text>
              <Text style={styles.reviewText}>Time: {selectedTime} - {generateEndTime(selectedTime)}</Text>
              <Text style={styles.reviewText}>CFI: {selectedCFI?.first_name} {selectedCFI?.last_name}</Text>
              <Text style={styles.reviewText}>Aircraft: {selectedAircraft?.tail_number}</Text>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitRequest}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit Request'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <View style={styles.navigationContainer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {step < 6 && (
          <TouchableOpacity
            style={[styles.nextButton, (!selectedStudent && step === 1) || (!selectedDate && step === 2) || (!selectedTime && step === 3) || (!selectedCFI && step === 4) || (!selectedAircraft && step === 5) ? styles.disabledButton : null]}
            onPress={() => setStep(step + 1)}
            disabled={(!selectedStudent && step === 1) || (!selectedDate && step === 2) || (!selectedTime && step === 3) || (!selectedCFI && step === 4) || (!selectedAircraft && step === 5)}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function StudentLessonRequestSystem() {
  return (
    <AutoAuthProvider>
      <StudentLessonRequestSystemContent />
    </AutoAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  loadingText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 50 },
  progressContainer: { alignItems: 'center', marginBottom: 20 },
  progressText: { fontSize: 16, color: '#666' },
  content: { flex: 1, marginBottom: 20 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  selectedOption: { backgroundColor: '#e3f2fd', borderColor: '#45B7D1', borderWidth: 2 },
  optionText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  optionSubtext: { fontSize: 14, color: '#666', marginTop: 4 },
  dateInput: { backgroundColor: 'white', padding: 15, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  reviewContainer: { backgroundColor: 'white', padding: 20, borderRadius: 8, marginBottom: 20 },
  reviewText: { fontSize: 16, marginBottom: 10, color: '#333' },
  submitButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  navigationContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 20 },
  backButton: { backgroundColor: '#6c757d', padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  backButtonText: { color: 'white', fontWeight: 'bold' },
  nextButton: { backgroundColor: '#45B7D1', padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  nextButtonText: { color: 'white', fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#ccc' }
});