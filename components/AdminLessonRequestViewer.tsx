import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

interface LessonRequest {
  id: string;
  student_id: string;
  cfi_id: string;
  aircraft_id: string;
  lesson_type: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  created_at: string;
  ticket_number?: string;
  students?: { first_name: string; last_name: string };
  cfis?: { first_name: string; last_name: string };
  aircraft?: { tail_number: string; make: string; model: string };
}

interface AdminLessonRequestViewerProps {
  onClose: () => void;
}

export default function AdminLessonRequestViewer({ onClose }: AdminLessonRequestViewerProps) {
  const [lessonRequests, setLessonRequests] = useState<LessonRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLessonRequests();
  }, []);

  const fetchLessonRequests = async () => {
    try {
      // Simplified query without joins to avoid PGRST201 error
      const { data, error } = await supabase
        .from('lesson_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch related data separately
      const enrichedData = await Promise.all(
        (data || []).map(async (request) => {
          const [studentData, cfiData, aircraftData] = await Promise.all([
            supabase.from('students').select('first_name, last_name').eq('id', request.student_id).single(),
            supabase.from('cfis').select('first_name, last_name').eq('id', request.cfi_id).single(),
            supabase.from('aircraft').select('tail_number, make, model').eq('id', request.aircraft_id).single()
          ]);
          
          return {
            ...request,
            students: studentData.data,
            cfis: cfiData.data,
            aircraft: aircraftData.data
          };
        })
      );
      
      setLessonRequests(enrichedData);
    } catch (error) {
      console.error('Error fetching lesson requests:', error);
      Alert.alert('Error', 'Failed to fetch lesson requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'completed': return '#9C27B0';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'completed': return 'trophy';
      default: return 'help-circle';
    }
  };

  const filteredRequests = lessonRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const filterOptions = [
    { key: 'all', label: 'All', count: lessonRequests.length },
    { key: 'pending', label: 'Pending', count: lessonRequests.filter(r => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: lessonRequests.filter(r => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: lessonRequests.filter(r => r.status === 'rejected').length },
    { key: 'completed', label: 'Completed', count: lessonRequests.filter(r => r.status === 'completed').length }
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Lesson Request Tickets</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[styles.filterButton, filter === option.key && styles.filterButtonActive]}
            onPress={() => setFilter(option.key)}
          >
            <Text style={[styles.filterText, filter === option.key && styles.filterTextActive]}>
              {option.label} ({option.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.requestsList}>
        {filteredRequests.map(request => (
          <View key={request.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View style={styles.ticketNumber}>
                <Text style={styles.ticketNumberText}>
                  #{request.ticket_number || `LR${request.id.slice(-6)}`}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Ionicons name={getStatusIcon(request.status) as any} size={16} color="white" />
                <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.ticketContent}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Student: {request.students?.first_name || 'Unknown'} {request.students?.last_name || ''}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="school" size={16} color="#666" />
                <Text style={styles.infoText}>
                  CFI: {request.cfis?.first_name || 'Unknown'} {request.cfis?.last_name || ''}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="airplane" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Aircraft: {request.aircraft?.tail_number || 'Unknown'} ({request.aircraft?.make || ''} {request.aircraft?.model || ''})
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="book" size={16} color="#666" />
                <Text style={styles.infoText}>Lesson: {request.lesson_type}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.infoText}>
                  {new Date(request.preferred_date).toLocaleDateString()} at {request.preferred_time}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Created: {new Date(request.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        ))}
        
        {filteredRequests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No lesson requests found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#007AFF', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 15 },
  filterContainer: { padding: 15, maxHeight: 60 },
  filterButton: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
  filterButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterText: { fontSize: 14, color: '#666' },
  filterTextActive: { color: 'white', fontWeight: '600' },
  requestsList: { flex: 1, padding: 15 },
  ticketCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  ticketNumber: { backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  ticketNumberText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  ticketContent: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#333', flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 10 }
});