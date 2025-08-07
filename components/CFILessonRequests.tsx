import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface LessonRequest {
  id: string;
  student_id: string;
  aircraft_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
  student_message?: string;
  cfi_message?: string;
}

interface Props {
  cfiId: string;
}

export default function CFILessonRequests({ cfiId }: Props) {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentNames, setStudentNames] = useState<{[key: string]: string}>({});
  const [aircraftNames, setAircraftNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchRequests();
    fetchStudentNames();
    fetchAircraftNames();
  }, [cfiId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching requests for CFI:', cfiId);
      
      const { data, error } = await supabase
        .from('lesson_requests')
        .select('*')
        .eq('cfi_id', cfiId)
        .in('status', ['pending', 'student_reviewing'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
      
      console.log('Fetched requests:', data);
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load lesson requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentNames = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name');
      
      const names: {[key: string]: string} = {};
      data?.forEach(student => {
        names[student.id] = `${student.first_name} ${student.last_name}`;
      });
      setStudentNames(names);
    } catch (error) {
      console.error('Error fetching student names:', error);
    }
  };

  const fetchAircraftNames = async () => {
    try {
      const { data } = await supabase
        .from('aircraft')
        .select('id, tail_number, model');
      
      const names: {[key: string]: string} = {};
      data?.forEach(aircraft => {
        names[aircraft.id] = `${aircraft.tail_number} - ${aircraft.model}`;
      });
      setAircraftNames(names);
    } catch (error) {
      console.error('Error fetching aircraft names:', error);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({ 
          status: 'approved',
          cfi_message: 'Request approved by CFI',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      Alert.alert('Success', 'Lesson request approved!');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({ 
          status: 'rejected',
          cfi_message: 'Request rejected by CFI',
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      Alert.alert('Success', 'Lesson request rejected');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Loading lesson requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Lesson Requests</Text>
      
      {requests.map(request => (
        <View key={request.id} style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 5 }}>
            Student: {studentNames[request.student_id] || 'Unknown Student'}
          </Text>
          <Text style={{ marginBottom: 3 }}>Date: {request.requested_date}</Text>
          <Text style={{ marginBottom: 3 }}>Time: {request.requested_start_time} - {request.requested_end_time}</Text>
          <Text style={{ marginBottom: 3 }}>Aircraft: {aircraftNames[request.aircraft_id] || 'Unknown Aircraft'}</Text>
          <Text style={{ marginBottom: 10, fontWeight: '500', color: request.status === 'pending' ? '#ffc107' : '#28a745' }}>
            Status: {request.status.toUpperCase()}
          </Text>
          
          {request.student_message && (
            <Text style={{ marginBottom: 10, fontStyle: 'italic', color: '#666' }}>
              Message: {request.student_message}
            </Text>
          )}
          
          {request.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 5, flex: 1 }}
                onPress={() => handleApprove(request.id)}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ backgroundColor: '#dc3545', padding: 12, borderRadius: 5, flex: 1 }}
                onPress={() => handleReject(request.id)}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      
      {requests.length === 0 && (
        <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ textAlign: 'center', color: '#666', fontSize: 16 }}>No pending lesson requests</Text>
          <Text style={{ textAlign: 'center', color: '#999', fontSize: 14, marginTop: 5 }}>Requests will appear here when students submit them</Text>
        </View>
      )}
    </ScrollView>
  );
}