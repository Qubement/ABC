import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface LessonRequest {
  id: string;
  cfi_id: string;
  aircraft_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
  student_message?: string;
  cfi_message?: string;
  original_request_id?: string;
  cfis?: { name: string };
  aircraft?: { tail_number: string; model: string };
}

interface Props {
  studentId: string;
}

export default function StudentLessonStatus({ studentId }: Props) {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [studentId]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_requests')
        .select(`
          *,
          cfis!inner(name),
          aircraft!inner(tail_number, model)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleAcceptModification = async (requestId: string) => {
    setLoading(true);
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status to accepted
      const { error: updateError } = await supabase
        .from('lesson_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Block availability for the modified time
      await supabase.from('availability_blocks').insert([
        {
          entity_type: 'cfi',
          entity_id: request.cfi_id,
          date: request.requested_date,
          start_time: request.requested_start_time,
          end_time: request.requested_end_time,
          is_available: false,
          blocked_by_lesson_id: requestId
        },
        {
          entity_type: 'aircraft',
          entity_id: request.aircraft_id,
          date: request.requested_date,
          start_time: request.requested_start_time,
          end_time: request.requested_end_time,
          is_available: false,
          blocked_by_lesson_id: requestId
        }
      ]);

      Alert.alert('Success', 'Modified lesson accepted!');
      fetchRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept modification');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectModification = async (requestId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({ status: 'denied' })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Success', 'Modification rejected');
      fetchRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject modification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#28a745';
      case 'denied': return '#dc3545';
      case 'pending': return '#ffc107';
      case 'student_reviewing': return '#17a2b8';
      case 'modified': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'denied': return 'Denied';
      case 'pending': return 'Pending CFI Review';
      case 'student_reviewing': return 'Awaiting Your Response';
      case 'modified': return 'Modified by CFI';
      default: return status;
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>My Lesson Requests</Text>
      
      {requests.map(request => (
        <View key={request.id} style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>CFI: {request.cfis?.name}</Text>
            <View style={{ backgroundColor: getStatusColor(request.status), paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {getStatusText(request.status)}
              </Text>
            </View>
          </View>
          
          <Text>Date: {request.requested_date}</Text>
          <Text>Time: {request.requested_start_time} - {request.requested_end_time}</Text>
          <Text>Aircraft: {request.aircraft?.tail_number} - {request.aircraft?.model}</Text>
          
          {request.cfi_message && (
            <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f8f9fa', borderRadius: 5 }}>
              <Text style={{ fontWeight: '600' }}>CFI Message:</Text>
              <Text>{request.cfi_message}</Text>
            </View>
          )}
          
          {request.status === 'student_reviewing' && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#28a745', padding: 10, borderRadius: 5, flex: 0.45 }}
                onPress={() => handleAcceptModification(request.id)}
                disabled={loading}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Accept</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ backgroundColor: '#dc3545', padding: 10, borderRadius: 5, flex: 0.45 }}
                onPress={() => handleRejectModification(request.id)}
                disabled={loading}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      
      {requests.length === 0 && (
        <Text style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>No lesson requests found</Text>
      )}
    </ScrollView>
  );
}