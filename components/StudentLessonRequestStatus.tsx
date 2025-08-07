import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, TextInput } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface LessonRequest {
  id: string;
  cfi_id: string;
  aircraft_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  modified_date?: string;
  modified_start_time?: string;
  modified_end_time?: string;
  modified_cfi_id?: string;
  modified_aircraft_id?: string;
  status: string;
  cfi_message?: string;
  student_message?: string;
  cfis?: { name: string };
  aircraft?: { tail_number: string; model: string };
  modified_cfi?: { name: string };
  modified_aircraft?: { tail_number: string; model: string };
}

interface Props {
  studentId: string;
}

export default function StudentLessonRequestStatus({ studentId }: Props) {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [actualStudentId, setActualStudentId] = useState('');

  useEffect(() => {
    fetchStudentId();
  }, [studentId]);

  useEffect(() => {
    if (actualStudentId) {
      fetchRequests();
    }
  }, [actualStudentId]);

  const fetchStudentId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (student) {
          setActualStudentId(student.id);
        }
      }
    } catch (error) {
      console.error('Error fetching student ID:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_requests')
        .select(`
          *,
          cfis!lesson_requests_cfi_id_fkey(name),
          aircraft!lesson_requests_aircraft_id_fkey(tail_number, model)
        `)
        .eq('student_id', actualStudentId)
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

      const { error: updateError } = await supabase
        .from('lesson_requests')
        .update({
          status: 'accepted',
          student_message: responseMessage || 'Modification accepted'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Modified lesson accepted!');
      setSelectedRequest(null);
      setResponseMessage('');
      fetchRequests();
    } catch (error) {
      console.error('Error accepting modification:', error);
      Alert.alert('Error', 'Failed to accept modification');
    } finally {
      setLoading(false);
    }
  };

  const handleDenyModification = async (requestId: string) => {
    if (!responseMessage.trim()) {
      Alert.alert('Error', 'Please provide a reason for denial');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({
          status: 'denied',
          student_message: responseMessage
        })
        .eq('id', requestId);

      if (error) throw error;

      Alert.alert('Success', 'Modification denied');
      setSelectedRequest(null);
      setResponseMessage('');
      fetchRequests();
    } catch (error) {
      console.error('Error denying modification:', error);
      Alert.alert('Error', 'Failed to deny modification');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'accepted': return '#28a745';
      case 'denied': return '#dc3545';
      case 'student_reviewing': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Lesson Requests</Text>
      
      {requests.map(request => {
        const isReviewing = selectedRequest === request.id;
        const needsStudentReview = request.status === 'student_reviewing';
        
        return (
          <View key={request.id} style={[styles.requestCard, { borderLeftColor: getStatusColor(request.status) }]}>
            <View style={styles.requestHeader}>
              <Text style={styles.statusText}>Status: {request.status.replace('_', ' ').toUpperCase()}</Text>
              <Text style={styles.dateText}>{request.requested_date}</Text>
            </View>
            
            <View style={styles.requestDetails}>
              <Text style={styles.detailText}>Time: {formatTime(request.requested_start_time)} - {formatTime(request.requested_end_time)}</Text>
              <Text style={styles.detailText}>CFI: {request.cfis?.name}</Text>
              <Text style={styles.detailText}>Aircraft: {request.aircraft?.tail_number} - {request.aircraft?.model}</Text>
            </View>

            {request.cfi_message && (
              <View style={styles.messageSection}>
                <Text style={styles.messageTitle}>CFI Message:</Text>
                <Text style={styles.messageText}>{request.cfi_message}</Text>
              </View>
            )}

            {needsStudentReview && !isReviewing && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => setSelectedRequest(request.id)}
              >
                <Text style={styles.reviewButtonText}>Review Changes</Text>
              </TouchableOpacity>
            )}

            {isReviewing && (
              <View style={styles.reviewSection}>
                <Text style={styles.responseLabel}>Your Response:</Text>
                <TextInput
                  style={styles.responseInput}
                  value={responseMessage}
                  onChangeText={setResponseMessage}
                  placeholder="Enter your response..."
                  multiline
                  numberOfLines={2}
                />
                
                <View style={styles.reviewButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton, loading && styles.disabledButton]}
                    onPress={() => handleAcceptModification(request.id)}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>{loading ? 'Processing...' : 'Accept'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.denyButton, loading && styles.disabledButton]}
                    onPress={() => handleDenyModification(request.id)}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>{loading ? 'Processing...' : 'Deny'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })}
      
      {requests.length === 0 && (
        <Text style={styles.noRequestsText}>No lesson requests found</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  requestDetails: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  messageSection: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  reviewButton: {
    backgroundColor: '#17a2b8',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reviewSection: {
    marginTop: 10,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  reviewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
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
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noRequestsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
    fontSize: 16,
  },
});