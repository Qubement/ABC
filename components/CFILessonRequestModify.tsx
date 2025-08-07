import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';
import RollerPicker from './RollerPicker';

interface LessonRequest {
  id: string;
  student_id: string;
  aircraft_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
  students?: { name: string };
  aircraft?: { tail_number: string; model: string };
}

interface Props {
  request: LessonRequest;
  cfiId: string;
  onComplete: () => void;
  availableCFIs: Array<{id: string; first_name: string; last_name: string}>;
  availableAircraft: Array<{id: string; tail_number: string; model: string}>;
}

export default function CFILessonRequestModify({ request, cfiId, onComplete, availableCFIs, availableAircraft }: Props) {
  const [modifiedDate, setModifiedDate] = useState(request.requested_date);
  const [modifiedStartTime, setModifiedStartTime] = useState(request.requested_start_time);
  const [modifiedEndTime, setModifiedEndTime] = useState(request.requested_end_time);
  const [modifiedCFI, setModifiedCFI] = useState(cfiId);
  const [modifiedAircraft, setModifiedAircraft] = useState(request.aircraft_id);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);

  useEffect(() => {
    generateAvailableDates();
    generateAvailableTimes();
  }, []);

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setAvailableDates(dates);
  };

  const generateAvailableTimes = () => {
    const times = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        times.push(timeStr);
      }
    }
    setAvailableTimes(times);
  };

  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + 1;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const handleStartTimeChange = (time: string) => {
    setModifiedStartTime(time);
    setModifiedEndTime(calculateEndTime(time));
  };

  const handleSubmitModification = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please provide a message explaining the changes');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({
          status: 'student_reviewing',
          modified_date: modifiedDate,
          modified_start_time: modifiedStartTime,
          modified_end_time: modifiedEndTime,
          modified_cfi_id: modifiedCFI,
          modified_aircraft_id: modifiedAircraft,
          cfi_message: message
        })
        .eq('id', request.id);

      if (error) throw error;

      Alert.alert('Success', 'Modified lesson request sent to student for approval');
      onComplete();
    } catch (error) {
      console.error('Error submitting modification:', error);
      Alert.alert('Error', 'Failed to submit modification');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeDisplay = (time: string) => {
    return time.slice(0, 5);
  };

  const formatDateDisplay = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Modify Lesson Request</Text>
      
      <View style={styles.originalDetails}>
        <Text style={styles.sectionTitle}>Original Request:</Text>
        <Text style={styles.detailText}>Student: {request.students?.name}</Text>
        <Text style={styles.detailText}>Date: {request.requested_date}</Text>
        <Text style={styles.detailText}>Time: {formatTimeDisplay(request.requested_start_time)} - {formatTimeDisplay(request.requested_end_time)}</Text>
        <Text style={styles.detailText}>Aircraft: {request.aircraft?.tail_number}</Text>
      </View>

      <View style={styles.modificationSection}>
        <Text style={styles.sectionTitle}>Proposed Changes:</Text>
        
        <Text style={styles.label}>Date:</Text>
        <RollerPicker
          items={availableDates.map(date => ({ label: formatDateDisplay(date), value: date }))}
          selectedValue={modifiedDate}
          onValueChange={setModifiedDate}
        />

        <Text style={styles.label}>Start Time:</Text>
        <RollerPicker
          items={availableTimes.map(time => ({ label: formatTimeDisplay(time), value: time }))}
          selectedValue={modifiedStartTime}
          onValueChange={handleStartTimeChange}
        />

        <Text style={styles.label}>CFI:</Text>
        <RollerPicker
          items={availableCFIs.map(cfi => ({ 
            label: `${cfi.first_name} ${cfi.last_name}`, 
            value: cfi.id 
          }))}
          selectedValue={modifiedCFI}
          onValueChange={setModifiedCFI}
        />

        <Text style={styles.label}>Aircraft:</Text>
        <RollerPicker
          items={availableAircraft.map(aircraft => ({ 
            label: `${aircraft.tail_number} - ${aircraft.model}`, 
            value: aircraft.id 
          }))}
          selectedValue={modifiedAircraft}
          onValueChange={setModifiedAircraft}
        />
      </View>

      <Text style={styles.label}>Message to Student (Required):</Text>
      <TextInput
        style={styles.textInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Explain the changes and reason for modification..."
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabledButton]}
        onPress={handleSubmitModification}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Send Modified Request'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  originalDetails: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  modificationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 15,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#ffc107',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});