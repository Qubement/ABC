import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { supabase } from '../app/lib/supabase';
import LessonRequestNotification from './LessonRequestNotification';

interface LessonRequest {
  id: string;
  student_id: string;
  date: string;
  time: string;
  aircraft_id: string;
  status: string;
  created_at: string;
  students: { name: string };
  aircraft: { tail_number: string };
}

interface CFINotificationCenterProps {
  cfiId: string;
}

export default function CFINotificationCenter({ cfiId }: CFINotificationCenterProps) {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [cfiId]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_requests')
        .select(`
          *,
          students(name),
          aircraft(tail_number)
        `)
        .eq('cfi_id', cfiId)
        .eq('status', 'pending')
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

  const handleRequestUpdate = () => {
    loadRequests();
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
      <Text style={styles.title}>Lesson Requests</Text>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        ) : (
          requests.map((request) => (
            <LessonRequestNotification
              key={request.id}
              requestId={request.id}
              studentName={request.students?.name || 'Unknown Student'}
              date={request.date}
              time={request.time}
              aircraft={request.aircraft?.tail_number || 'Unknown Aircraft'}
              onApprove={handleRequestUpdate}
              onReject={handleRequestUpdate}
            />
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
  }
});