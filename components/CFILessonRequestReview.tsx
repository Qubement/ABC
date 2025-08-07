import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../app/lib/supabase';

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

export default function CFILessonRequestReview({ request, cfiId, onComplete }: Props) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Update lesson request to accepted
      const { error: updateError } = await supabase
        .from('lesson_requests')
        .update({
          status: 'accepted',
          cfi_message: message || 'Lesson request accepted'
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Block schedule for CFI and aircraft
      const { error: cfiScheduleError } = await supabase
        .from('schedules')
        .update({ is_available: false })
        .eq('entity_type', 'cfi')
        .eq('entity_id', cfiId)
        .eq('date', request.requested_date)
        .eq('start_time', request.requested_start_time);

      if (cfiScheduleError) throw cfiScheduleError;

      const { error: aircraftScheduleError } = await supabase
        .from('schedules')
        .update({ is_available: false })
        .eq('entity_type', 'aircraft')
        .eq('entity_id', request.aircraft_id)
        .eq('date', request.requested_date)
        .eq('start_time', request.requested_start_time);

      if (aircraftScheduleError) throw aircraftScheduleError;

      // Create lesson record
      const { error: lessonError } = await supabase
        .from('lessons')
        .insert({
          student_id: request.student_id,
          cfi_id: cfiId,
          aircraft_id: request.aircraft_id,
          date: request.requested_date,
          start_time: request.requested_start_time,
          end_time: request.requested_end_time,
          status: 'scheduled'
        });

      if (lessonError) throw lessonError;

      Alert.alert('Success', 'Lesson request accepted and scheduled!');
      onComplete();
    } catch (error) {
      console.error('Error accepting lesson:', error);
      Alert.alert('Error', 'Failed to accept lesson request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please provide a reason for denial');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({
          status: 'denied',
          cfi_message: message
        })
        .eq('id', request.id);

      if (error) throw error;

      Alert.alert('Success', 'Lesson request denied');
      onComplete();
    } catch (error) {
      console.error('Error denying lesson:', error);
      Alert.alert('Error', 'Failed to deny lesson request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Lesson Request</Text>
      
      <View style={styles.details}>
        <Text style={styles.detailText}>Student: {request.students?.name}</Text>
        <Text style={styles.detailText}>Date: {request.requested_date}</Text>
        <Text style={styles.detailText}>Time: {request.requested_start_time} - {request.requested_end_time}</Text>
        <Text style={styles.detailText}>Aircraft: {request.aircraft?.tail_number} - {request.aircraft?.model}</Text>
      </View>

      <Text style={styles.label}>Message to Student (Optional for Accept, Required for Deny):</Text>
      <TextInput
        style={styles.textInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Enter your message..."
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.acceptButton, loading && styles.disabledButton]}
          onPress={handleAccept}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Accept'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.denyButton, loading && styles.disabledButton]}
          onPress={handleDeny}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Deny'}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  details: {
    marginBottom: 20,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  denyButton: {
    backgroundColor: '#dc3545',
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