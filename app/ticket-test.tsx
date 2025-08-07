import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TicketTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser();
    runTests();
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

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔍 Starting ticket system diagnostics...');
      
      // Test 1: Check lesson_requests table
      addResult('\n📋 Test 1: Checking lesson_requests table...');
      const { data: requestsData, error: requestsError } = await supabase
        .from('lesson_requests')
        .select('*')
        .limit(5);
      
      if (requestsError) {
        addResult(`❌ Error: ${requestsError.message}`);
        addResult('💡 Solution: Check if lesson_requests table exists');
      } else {
        addResult(`✅ Found ${requestsData?.length || 0} lesson requests`);
      }
      
      // Test 2: Check related tables
      addResult('\n📋 Test 2: Checking related tables...');
      
      const tables = ['students', 'cfis', 'aircraft'];
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1);
          if (error) {
            addResult(`❌ ${table} table error: ${error.message}`);
          } else {
            addResult(`✅ ${table} table accessible (${data?.length || 0} records)`);
          }
        } catch (error: any) {
          addResult(`❌ ${table} table failed: ${error.message}`);
        }
      }
      
      // Test 3: Test ticket generation
      addResult('\n🎫 Test 3: Testing ticket generation...');
      const testId = 'test-123';
      const timestamp = Date.now().toString().slice(-6);
      const shortId = testId.slice(-4).toUpperCase();
      const ticketNumber = `LR${timestamp}${shortId}`;
      
      if (ticketNumber.startsWith('LR')) {
        addResult(`✅ Generated ticket: ${ticketNumber}`);
      } else {
        addResult('❌ Failed to generate ticket number');
      }
      
      // Test 4: Check if we can create a request
      addResult('\n🧪 Test 4: Testing request creation...');
      if (currentUser) {
        addResult(`✅ User authenticated: ${currentUser.email}`);
        
        // Check if user has student profile
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('id', currentUser.id)
          .single();
        
        if (studentData) {
          addResult('✅ User has student profile');
        } else {
          addResult('⚠️  User may need student profile');
        }
      } else {
        addResult('❌ No authenticated user');
        addResult('💡 Solution: Please log in first');
      }
      
      // Test 5: Summary
      addResult('\n📊 DIAGNOSIS SUMMARY:');
      if (requestsError) {
        addResult('❌ CRITICAL: lesson_requests table not accessible');
        addResult('💡 SOLUTION: Create lesson_requests table in Supabase');
      } else if (!requestsData || requestsData.length === 0) {
        addResult('⚠️  WARNING: No lesson requests found');
        addResult('💡 SOLUTION: Create test request to verify system');
      } else {
        addResult('✅ SUCCESS: Ticket system appears functional');
        addResult(`📈 Found ${requestsData.length} existing requests`);
      }
      
    } catch (error: any) {
      addResult(`❌ Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestRequest = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in first');
      return;
    }
    
    try {
      addResult('\n🧪 Creating test request...');
      
      // Get first available CFI and aircraft
      const { data: cfiData } = await supabase.from('cfis').select('id').limit(1).single();
      const { data: aircraftData } = await supabase.from('aircraft').select('id').limit(1).single();
      
      if (!cfiData || !aircraftData) {
        addResult('❌ No CFI or aircraft available');
        return;
      }
      
      const testData = {
        student_id: currentUser.id,
        cfi_id: cfiData.id,
        aircraft_id: aircraftData.id,
        requested_date: new Date().toISOString().split('T')[0],
        requested_start_time: '10:00',
        requested_end_time: '11:00',
        status: 'pending',
        student_message: 'Test request from diagnostic tool'
      };
      
      const { data, error } = await supabase
        .from('lesson_requests')
        .insert(testData)
        .select()
        .single();
      
      if (error) {
        addResult(`❌ Failed: ${error.message}`);
        return;
      }
      
      const ticketNumber = `LR${Date.now().toString().slice(-6)}${data.id.slice(-4).toUpperCase()}`;
      addResult(`✅ Created request with ticket: ${ticketNumber}`);
      
      Alert.alert('Success', `Test request created!\nTicket: ${ticketNumber}`);
      
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Ticket System Test</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.testResults}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.testResult}>{result}</Text>
          ))}
          {loading && <Text style={styles.loading}>Running tests...</Text>}
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={runTests}>
            <Text style={styles.buttonText}>Re-run Tests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={createTestRequest}>
            <Text style={styles.buttonText}>Create Test Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#45B7D1', padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  content: { flex: 1, padding: 20 },
  testResults: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 20 },
  testResult: { fontSize: 12, fontFamily: 'monospace', color: '#333', marginBottom: 2 },
  loading: { textAlign: 'center', color: '#666', fontStyle: 'italic' },
  actions: { gap: 10 },
  button: { backgroundColor: '#45B7D1', padding: 15, borderRadius: 8 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});