import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

export default function LessonRequestFixedForm() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCFI, setSelectedCFI] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [cfis, setCfis] = useState<any[]>([]);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUserData();
    loadCFIs();
    loadAircraft();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
      
      if (user) {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (studentError) {
          console.log('Student profile not found, creating one...');
          const { data: newStudent, error: createError } = await supabase
            .from('students')
            .insert({
              user_id: user.id,
              first_name: 'Test',
              last_name: 'Student',
              email: user.email || 'test@example.com'
            })
            .select()
            .single();
          
          if (createError) throw createError;
          setStudentProfile(newStudent);
        } else {
          setStudentProfile(student);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCFIs = async () => {
    try {
      const { data, error } = await supabase
        .from('cfis')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      setCfis(data || []);
    } catch (error) {
      console.error('Error loading CFIs:', error);
    }
  };

  const loadAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      setAircraft(data || []);
    } catch (error) {
      console.error('Error loading aircraft:', error);
    }
  };

  const generateMockDates = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const generateMockTimes = () => {
    return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedCFI || !selectedAircraft) {
      Alert.alert('Error', 'Please select all fields');
      return;
    }

    if (!studentProfile) {
      Alert.alert('Error', 'Student profile not found');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const startTime = new Date(`2000-01-01T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      const requestData = {
        student_id: studentProfile.id,
        cfi_id: selectedCFI,
        aircraft_id: selectedAircraft,
        requested_date: selectedDate,
        requested_start_time: selectedTime,
        requested_end_time: endTimeString,
        status: 'pending',
        student_message: 'Test lesson request from fixed form'
      };

      console.log('Submitting request:', requestData);

      const { data, error } = await supabase
        .from('lesson_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Request submitted successfully:', data);
      Alert.alert('Success', 'Lesson request submitted successfully!');
      
      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setSelectedCFI('');
      setSelectedAircraft('');
      
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', `Failed to submit: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mockDates = generateMockDates();
  const mockTimes = generateMockTimes();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fixed Lesson Request Form</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Select Date:</Text>
        <View style={styles.optionsContainer}>
          {mockDates.map(date => (
            <TouchableOpacity
              key={date}
              style={[styles.option, selectedDate === date && styles.selectedOption]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.optionText, selectedDate === date && styles.selectedText]}>
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Select Time:</Text>
        <View style={styles.optionsContainer}>
          {mockTimes.map(time => (
            <TouchableOpacity
              key={time}
              style={[styles.option, selectedTime === time && styles.selectedOption]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[styles.optionText, selectedTime === time && styles.selectedText]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Select CFI:</Text>
        <View style={styles.optionsContainer}>
          {cfis.map(cfi => (
            <TouchableOpacity
              key={cfi.id}
              style={[styles.option, selectedCFI === cfi.id && styles.selectedOption]}
              onPress={() => setSelectedCFI(cfi.id)}
            >
              <Text style={[styles.optionText, selectedCFI === cfi.id && styles.selectedText]}>
                {cfi.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Select Aircraft:</Text>
        <View style={styles.optionsContainer}>
          {aircraft.map(plane => (
            <TouchableOpacity
              key={plane.id}
              style={[styles.option, selectedAircraft === plane.id && styles.selectedOption]}
              onPress={() => setSelectedAircraft(plane.id)}
            >
              <Text style={[styles.optionText, selectedAircraft === plane.id && styles.selectedText]}>
                {plane.tail_number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  option: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  selectedOption: {
    backgroundColor: '#45B7D1',
    borderColor: '#45B7D1'
  },
  optionText: {
    color: '#333'
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold'
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginTop: 20
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});