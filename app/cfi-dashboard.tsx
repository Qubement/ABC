import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { router } from 'expo-router';
import SettingsDropdown from '../components/SettingsDropdown';
import CFIProfileChecker from '../components/CFIProfileChecker';
import CompleteFlightButton from '../components/CompleteFlightButton';
import CFINotificationCenter from '../components/CFINotificationCenter';
import { LessonRequestDeliverySystem } from '../components/LessonRequestDeliverySystem';

interface CFIData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  ratings?: string[];
  total_students?: number;
  upcoming_lessons?: number;
  completed_flights?: number;
}

function CFIDashboardContent() {
  const { userEmail, logout } = useAuth();
  const [cfiData, setCfiData] = useState<CFIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showLessonRequests, setShowLessonRequests] = useState(false);
  const [cfiId, setCfiId] = useState('');
  const [newRequestCount, setNewRequestCount] = useState(0);

  useEffect(() => {
    fetchCFIData();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (cfiId) {
      // Subscribe to real-time notifications
      const channel = LessonRequestDeliverySystem.subscribeToRequests(cfiId, (payload) => {
        setNewRequestCount(prev => prev + 1);
        Alert.alert('New Lesson Request', 'You have a new lesson request to review!');
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [cfiId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCfiId(user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const fetchCFIData = async () => {
    try {
      const { data, error } = await supabase
        .from('cfis')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCfiData(data);
      }
    } catch (error) {
      console.error('Error fetching CFI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowRequests = () => {
    setShowLessonRequests(true);
    setNewRequestCount(0); // Reset notification count
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading CFI Dashboard...</Text>
      </View>
    );
  }

  if (showLessonRequests) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowLessonRequests(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.nameText}>Lesson Requests</Text>
        </View>
        <CFINotificationCenter cfiId={cfiId} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>
            {cfiData?.first_name} {cfiData?.last_name}
          </Text>
          <Text style={styles.roleText}>Certified Flight Instructor</Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#34C759' }]}
            onPress={() => router.push('/request-lesson')}
          >
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Schedule Lesson</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
            onPress={handleShowRequests}
          >
            <Ionicons name="list-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Lesson Requests</Text>
            {newRequestCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{newRequestCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <CompleteFlightButton />
        </View>
      </ScrollView>

      <SettingsDropdown 
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}

export default function CFIDashboard() {
  return (
    <CFIProfileChecker>
      <CFIDashboardContent />
    </CFIProfileChecker>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    marginRight: 15,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  nameText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  roleText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    position: 'relative',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 12,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});