import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from './lib/supabase';
import CFILessonRequestsFixed from '../components/CFILessonRequestsFixed';

export default function CFIDashboardFixed() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [cfiProfile, setCfiProfile] = useState<any>(null);
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCFIData();
  }, []);

  const loadCFIData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      // Get or create CFI profile
      let { data: cfi, error: cfiError } = await supabase
        .from('cfis')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cfiError) {
        // Create CFI profile if it doesn't exist
        const { data: newCFI, error: createError } = await supabase
          .from('cfis')
          .insert({
            user_id: user.id,
            name: user.email?.split('@')[0] || 'CFI User',
            email: user.email || 'cfi@example.com',
            phone: '555-0100'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        cfi = newCFI;
      }
      
      setCfiProfile(cfi);
      
      // Get request count
      const { data: requests, error: requestError } = await supabase
        .from('lesson_requests')
        .select('id')
        .eq('cfi_id', cfi.id)
        .eq('status', 'pending');
      
      if (requestError) throw requestError;
      setRequestCount(requests?.length || 0);
      
    } catch (error) {
      console.error('Error loading CFI data:', error);
      Alert.alert('Error', 'Failed to load CFI profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadCFIData();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>CFI Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading CFI dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>CFI Dashboard (Fixed)</Text>
        <TouchableOpacity onPress={refreshData}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {cfiProfile && (
          <View style={styles.profileCard}>
            <Text style={styles.welcomeText}>Welcome, {cfiProfile.name}!</Text>
            <Text style={styles.profileText}>Email: {cfiProfile.email}</Text>
            <Text style={styles.profileText}>CFI ID: {cfiProfile.id}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{requestCount}</Text>
                <Text style={styles.statLabel}>Pending Requests</Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/test-lesson-request-fixed')}
          >
            <Ionicons name="flask" size={20} color="white" />
            <Text style={styles.actionButtonText}>Test Lesson Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#28a745' }]}
            onPress={refreshData}
          >
            <Ionicons name="refresh-circle" size={20} color="white" />
            <Text style={styles.actionButtonText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>
        
        {cfiProfile && (
          <CFILessonRequestsFixed cfiId={cfiProfile.id} />
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
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  content: {
    flex: 1
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  profileText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#45B7D1'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  actionsCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  actionButton: {
    backgroundColor: '#45B7D1',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  }
});