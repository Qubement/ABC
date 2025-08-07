import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../app/lib/supabase';
import CompleteFlightModal from './CompleteFlightModal';
import LessonRequestModal from './LessonRequestModal';
import StudentLessonRequestStatus from './StudentLessonRequestStatus';

interface StudentDashboardProps {
  userRole: string;
}

export default function StudentDashboard({ userRole }: StudentDashboardProps) {
  const [showCompleteFlightModal, setShowCompleteFlightModal] = useState(false);
  const [showLessonRequestModal, setShowLessonRequestModal] = useState(false);
  const [showLessonStatus, setShowLessonStatus] = useState(false);
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStudentId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const handleRequestLesson = () => {
    setShowLessonRequestModal(true);
  };

  const handleReserveAircraft = () => {
    router.push('/reserve-aircraft');
  };

  if (showLessonStatus) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowLessonStatus(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Lesson Requests</Text>
        </View>
        <StudentLessonRequestStatus studentId={studentId} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Student Dashboard</Text>
        <Text style={styles.subtitle}>Track your flight training progress</Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.requestButton} onPress={handleRequestLesson}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.requestButtonText}>Request Lesson</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.reserveButton} onPress={handleReserveAircraft}>
          <Ionicons name="airplane" size={24} color="white" />
          <Text style={styles.reserveButtonText}>Reserve Aircraft</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.completeButton} onPress={() => setShowCompleteFlightModal(true)}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.completeButtonText}>Complete Flight</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.statusButton} onPress={() => setShowLessonStatus(true)}>
          <Ionicons name="list" size={24} color="white" />
          <Text style={styles.statusButtonText}>View Lesson Requests</Text>
        </TouchableOpacity>
      </View>

      <CompleteFlightModal
        visible={showCompleteFlightModal}
        onClose={() => setShowCompleteFlightModal(false)}
        onComplete={() => setShowCompleteFlightModal(false)}
      />

      <LessonRequestModal
        visible={showLessonRequestModal}
        onClose={() => setShowLessonRequestModal(false)}
        studentId={studentId}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#45B7D1',
    padding: 30,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  buttonSection: {
    padding: 20,
    gap: 10,
  },
  requestButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reserveButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  reserveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusButton: {
    backgroundColor: '#17a2b8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});