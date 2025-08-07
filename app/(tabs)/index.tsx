import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import RoleBasedDashboardWithTickets from '../../components/RoleBasedDashboardWithTickets';

export default function TabIndex() {
  const { userRole } = useAuth();

  return (
    <View style={styles.container}>
      <RoleBasedDashboardWithTickets userRole={userRole} />
      
      {/* Test Button for Ticket System */}
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={() => router.push('/ticket-test')}
      >
        <Text style={styles.testButtonText}>🎫 Test Ticket System</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  testButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});