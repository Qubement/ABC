import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';
import LogoutButton from './LogoutButton';
import CFILessonRequests from './CFILessonRequests';

interface InstructorDashboardProps {
  userRole: string;
}

export default function InstructorDashboard({ userRole }: InstructorDashboardProps) {
  const { userEmail } = useAuth();
  const [showLessonRequests, setShowLessonRequests] = useState(false);
  const [cfiId, setCfiId] = useState('');
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    getCurrentCFI();
  }, []);

  useEffect(() => {
    if (cfiId) {
      fetchPendingRequestsCount();
    }
  }, [cfiId]);

  const getCurrentCFI = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCfiId(user.id);
      }
    } catch (error) {
      console.error('Error getting CFI:', error);
    }
  };

  const fetchPendingRequestsCount = async () => {
    try {
      const { count } = await supabase
        .from('lesson_requests')
        .select('*', { count: 'exact', head: true })
        .eq('cfi_id', cfiId)
        .in('status', ['pending', 'student_reviewing']);
      
      setPendingRequestsCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  if (showLessonRequests) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowLessonRequests(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Lesson Requests</Text>
        </View>
        <CFILessonRequests cfiId={cfiId} />
      </View>
    );
  }

  const dashboardItems = [
    { title: 'My Schedule', icon: 'calendar', color: '#007AFF' },
    { title: 'Students', icon: 'people', color: '#34C759' },
    { title: 'Flight Logs', icon: 'airplane', color: '#FF9500' },
    { title: 'Profile', icon: 'person', color: '#5856D6' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Instructor Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, {userEmail}</Text>
        </View>
        <LogoutButton />
      </View>

      <View style={styles.grid}>
        {dashboardItems.map((item, index) => (
          <TouchableOpacity key={index} style={[styles.card, { borderLeftColor: item.color }]}>
            <Ionicons name={item.icon as any} size={32} color={item.color} />
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: pendingRequestsCount > 0 ? '#dc3545' : '#007AFF' }]}
          onPress={() => setShowLessonRequests(true)}
        >
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonText}>Review Lesson Requests</Text>
            {pendingRequestsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Schedule New Lesson</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Log Flight Time</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  grid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  badgeText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: 'bold',
  },
});