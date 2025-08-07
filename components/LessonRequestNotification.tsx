import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

interface LessonRequestNotificationProps {
  requestId: string;
  studentName: string;
  date: string;
  time: string;
  aircraft: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function LessonRequestNotification({
  requestId,
  studentName,
  date,
  time,
  aircraft,
  onApprove,
  onReject
}: LessonRequestNotificationProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await supabase
        .from('lesson_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);
      
      Alert.alert('Success', 'Lesson request approved!');
      onApprove();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request');
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await supabase
        .from('lesson_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      
      Alert.alert('Success', 'Lesson request rejected');
      onReject();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person" size={24} color="#45B7D1" />
        <Text style={styles.studentName}>{studentName}</Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.detailText}>Date: {date}</Text>
        <Text style={styles.detailText}>Time: {time}</Text>
        <Text style={styles.detailText}>Aircraft: {aircraft}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.button, styles.approveButton]} 
          onPress={handleApprove}
          disabled={isProcessing}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.rejectButton]} 
          onPress={handleReject}
          disabled={isProcessing}
        >
          <Ionicons name="close" size={20} color="white" />
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333'
  },
  details: {
    marginBottom: 15
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  actions: {
    flexDirection: 'row',
    gap: 10
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 5
  },
  approveButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#f44336'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});