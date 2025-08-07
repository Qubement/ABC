import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

interface LessonRequest {
  id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  cfis: { first_name: string; last_name: string };
  aircraft: { tail_number: string };
}

interface StudentLessonRequestTrackerProps {
  studentId: string;
}

export default function StudentLessonRequestTracker({ studentId }: StudentLessonRequestTrackerProps) {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [studentId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_requests')
        .select(`
          *,
          cfis(first_name, last_name),
          aircraft(tail_number)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'pending': return '#FF9800';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Lesson Requests</Text>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No lesson requests yet</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.statusBadge}>
                  <Ionicons 
                    name={getStatusIcon(request.status)} 
                    size={16} 
                    color={getStatusColor(request.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                    {request.status.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.requestDetails}>
                <Text style={styles.detailText}>Date: {request.date}</Text>
                <Text style={styles.detailText}>Time: {request.time}</Text>
                <Text style={styles.detailText}>
                  CFI: {request.cfis?.first_name} {request.cfis?.last_name}
                </Text>
                <Text style={styles.detailText}>
                  Aircraft: {request.aircraft?.tail_number}
                </Text>
              </View>
              
              {request.approved_at && (
                <Text style={styles.timestampText}>
                  Approved: {new Date(request.approved_at).toLocaleString()}
                </Text>
              )}
              
              {request.rejected_at && (
                <Text style={styles.timestampText}>
                  Rejected: {new Date(request.rejected_at).toLocaleString()}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    color: '#333'
  },
  scrollView: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  dateText: {
    fontSize: 12,
    color: '#666'
  },
  requestDetails: {
    marginBottom: 10
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  }
});