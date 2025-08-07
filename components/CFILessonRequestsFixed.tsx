import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface LessonRequest {
  id: string;
  student_id: string;
  cfi_id: string;
  aircraft_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
  student_message?: string;
  cfi_message?: string;
  created_at: string;
}

interface Props {
  cfiId: string;
}

export default function CFILessonRequestsFixed({ cfiId }: Props) {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentNames, setStudentNames] = useState<{[key: string]: string}>({});
  const [aircraftNames, setAircraftNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadData();
  }, [cfiId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRequests(),
        fetchStudentNames(),
        fetchAircraftNames()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      console.log('Fetching requests for CFI:', cfiId);
      
      const { data, error } = await supabase
        .from('lesson_requests')
        .select('*')
        .eq('cfi_id', cfiId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
      
      console.log('Fetched requests:', data?.length || 0, 'requests');
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load lesson requests');
    }
  };

  const fetchStudentNames = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, email');
      
      if (error) throw error;
      
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
      const { data, error } = await supabase
        .from('aircraft')
        .select('id, tail_number, model');
      
      if (error) throw error;
      
      const names: {[key: string]: string} = {};
      data?.forEach(aircraft => {
        names[aircraft.id] = `${aircraft.tail_number} (${aircraft.model})`;
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
      await fetchRequests();
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
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#666' }}>Loading lesson requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f5f5f5' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
          Lesson Requests ({requests.length})
        </Text>
        
        {requests.map(request => (
          <View key={request.id} style={{
            backgroundColor: 'white',
            padding: 15,
            borderRadius: 12,
            marginBottom: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            borderLeftWidth: 4,
            borderLeftColor: getStatusColor(request.status)
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>
                {studentNames[request.student_id] || `Student ID: ${request.student_id}`}
              </Text>
              <View style={{
                backgroundColor: getStatusColor(request.status),
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                  {request.status.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 2 }}>
                📅 Date: {request.requested_date}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 2 }}>
                ⏰ Time: {request.requested_start_time} - {request.requested_end_time}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 2 }}>
                ✈️ Aircraft: {aircraftNames[request.aircraft_id] || `Aircraft ID: ${request.aircraft_id}`}
              </Text>
              <Text style={{ fontSize: 12, color: '#999' }}>
                📝 Submitted: {new Date(request.created_at).toLocaleDateString()}
              </Text>
            </View>
            
            {request.student_message && (
              <View style={{ backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontStyle: 'italic', color: '#666' }}>
                  💬 "{request.student_message}"
                </Text>
              </View>
            )}
            
            {request.cfi_message && (
              <View style={{ backgroundColor: '#e9ecef', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#495057' }}>
                  CFI Response: {request.cfi_message}
                </Text>
              </View>
            )}
            
            {request.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#28a745',
                    padding: 12,
                    borderRadius: 8,
                    flex: 1,
                    alignItems: 'center'
                  }}
                  onPress={() => handleApprove(request.id)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>✅ Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: '#dc3545',
                    padding: 12,
                    borderRadius: 8,
                    flex: 1,
                    alignItems: 'center'
                  }}
                  onPress={() => handleReject(request.id)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>❌ Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        
        {requests.length === 0 && (
          <View style={{
            backgroundColor: 'white',
            padding: 40,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 20
          }}>
            <Text style={{ fontSize: 48, marginBottom: 10 }}>📋</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 5 }}>
              No Lesson Requests
            </Text>
            <Text style={{ textAlign: 'center', color: '#666', fontSize: 14 }}>
              Lesson requests from students will appear here.
              Pull down to refresh.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}