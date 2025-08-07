import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { TicketService } from './TicketService';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export default function TicketSystemDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const addResult = (test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string) => {
    setResults(prev => [...prev, { test, status, message, details }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // Test 1: Database connectivity
      addResult('Database Connection', 'pass', 'Testing database connection...');
      
      // Test 2: Check lesson_requests table structure
      const { data: requestsData, error: requestsError } = await supabase
        .from('lesson_requests')
        .select('*')
        .limit(1);
      
      if (requestsError) {
        addResult('Lesson Requests Table', 'fail', 'Cannot access lesson_requests table', requestsError.message);
      } else {
        addResult('Lesson Requests Table', 'pass', 'lesson_requests table accessible');
      }
      
      // Test 3: Check related tables
      const tables = [
        { name: 'students', fields: 'id, first_name, last_name' },
        { name: 'cfis', fields: 'id, name' },
        { name: 'aircraft', fields: 'id, tail_number, model' }
      ];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table.name)
            .select(table.fields)
            .limit(1);
          
          if (error) {
            addResult(`${table.name} Table`, 'fail', `Cannot access ${table.name} table`, error.message);
          } else {
            addResult(`${table.name} Table`, 'pass', `${table.name} table accessible`);
          }
        } catch (error: any) {
          addResult(`${table.name} Table`, 'fail', `Error accessing ${table.name}`, error.message);
        }
      }
      
      // Test 4: Ticket generation functionality
      const testId = 'test-123';
      const ticketNumber = TicketService.generateTicketNumber(testId);
      
      if (ticketNumber && ticketNumber.startsWith('LR')) {
        addResult('Ticket Generation', 'pass', `Generated ticket: ${ticketNumber}`);
      } else {
        addResult('Ticket Generation', 'fail', 'Failed to generate valid ticket number');
      }
      
      // Test 5: Check if there are any lesson requests
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('lesson_requests')
        .select('*');
      
      if (allRequestsError) {
        addResult('Existing Requests', 'fail', 'Cannot fetch existing requests', allRequestsError.message);
      } else {
        const count = allRequests?.length || 0;
        if (count === 0) {
          addResult('Existing Requests', 'warning', 'No lesson requests found in database', 'Try creating a test request');
        } else {
          addResult('Existing Requests', 'pass', `Found ${count} lesson requests`);
        }
      }
      
      // Test 6: Test full ticket generation from real data
      if (allRequests && allRequests.length > 0) {
        const testRequest = allRequests[0];
        const ticket = await TicketService.generateTicketFromRequest(testRequest);
        
        if (ticket) {
          addResult('Full Ticket Generation', 'pass', 'Successfully generated ticket from request data');
        } else {
          addResult('Full Ticket Generation', 'fail', 'Failed to generate ticket from request data');
        }
      }
      
      // Test 7: Check user authentication
      if (currentUser) {
        addResult('User Authentication', 'pass', `User authenticated: ${currentUser.email}`);
      } else {
        addResult('User Authentication', 'warning', 'No authenticated user found');
      }
      
      // Test 8: Check if user can create requests
      if (currentUser) {
        const { data: userData, error: userError } = await supabase
          .from('students')
          .select('id')
          .eq('id', currentUser.id)
          .single();
        
        if (userError && userError.code !== 'PGRST116') {
          addResult('User Profile', 'fail', 'Error checking user profile', userError.message);
        } else if (userData) {
          addResult('User Profile', 'pass', 'User has student profile');
        } else {
          addResult('User Profile', 'warning', 'User may not have student profile');
        }
      }
      
    } catch (error: any) {
      addResult('System Error', 'fail', 'Diagnostic failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestRequest = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to create test request');
      return;
    }
    
    try {
      // Get first available CFI and aircraft
      const { data: cfiData } = await supabase.from('cfis').select('id').limit(1).single();
      const { data: aircraftData } = await supabase.from('aircraft').select('id').limit(1).single();
      
      if (!cfiData || !aircraftData) {
        Alert.alert('Error', 'No CFI or aircraft available for test');
        return;
      }
      
      const testRequestData = {
        student_id: currentUser.id,
        cfi_id: cfiData.id,
        aircraft_id: aircraftData.id,
        requested_date: new Date().toISOString().split('T')[0],
        requested_start_time: '10:00',
        requested_end_time: '11:00',
        status: 'pending',
        student_message: 'Test request created by diagnostic tool'
      };
      
      const { data, error } = await supabase
        .from('lesson_requests')
        .insert(testRequestData)
        .select()
        .single();
      
      if (error) {
        Alert.alert('Error', `Failed to create test request: ${error.message}`);
        return;
      }
      
      const ticketNumber = TicketService.generateTicketNumber(data.id);
      Alert.alert('Success', `Created test request with ticket: ${ticketNumber}`);
      
      // Re-run diagnostics
      runDiagnostics();
      
    } catch (error: any) {
      Alert.alert('Error', `Error creating test request: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ticket System Diagnostic</Text>
        <TouchableOpacity style={styles.button} onPress={runDiagnostics} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Running...' : 'Run Diagnostics'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.results}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.resultHeader}>
              {getStatusIcon(result.status)} {result.test}
            </Text>
            <Text style={styles.resultMessage}>{result.message}</Text>
            {result.details && (
              <Text style={styles.resultDetails}>{result.details}</Text>
            )}
          </View>
        ))}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={createTestRequest}>
          <Text style={styles.buttonText}>Create Test Request</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  button: {
    backgroundColor: '#45B7D1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  results: {
    marginBottom: 20
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  resultHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  resultMessage: {
    fontSize: 14,
    color: '#666'
  },
  resultDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic'
  },
  actions: {
    marginTop: 20
  }
});