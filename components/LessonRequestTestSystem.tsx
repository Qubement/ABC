import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import AutoAuthProvider from './AutoAuthProvider';

function LessonRequestTestSystemContent() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const { isAuthenticated } = useAuth();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const createTestData = async () => {
    setTesting(true);
    addTestResult('Starting test data creation...');
    
    try {
      // Create test student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          first_name: 'Test',
          last_name: 'Student',
          email: 'test.student@example.com',
          phone: '555-0123',
          status: 'active'
        })
        .select()
        .single();

      if (studentError) throw studentError;
      addTestResult(`✓ Created test student: ${student.first_name} ${student.last_name}`);

      // Create test CFI
      const { data: cfi, error: cfiError } = await supabase
        .from('cfis')
        .insert({
          first_name: 'Test',
          last_name: 'CFI',
          email: 'test.cfi@example.com',
          phone: '555-0124',
          status: 'active'
        })
        .select()
        .single();

      if (cfiError) throw cfiError;
      addTestResult(`✓ Created test CFI: ${cfi.first_name} ${cfi.last_name}`);

      // Create test aircraft
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .insert({
          tail_number: 'N123TEST',
          make: 'Cessna',
          model: '172',
          status: 'active'
        })
        .select()
        .single();

      if (aircraftError) throw aircraftError;
      addTestResult(`✓ Created test aircraft: ${aircraft.tail_number}`);

      // Create test lesson request
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const { data: lessonRequest, error: requestError } = await supabase
        .from('lesson_requests')
        .insert({
          student_id: student.id,
          cfi_id: cfi.id,
          aircraft_id: aircraft.id,
          requested_date: dateString,
          requested_start_time: '10:00',
          requested_end_time: '11:00',
          status: 'pending',
          student_message: 'Test lesson request'
        })
        .select()
        .single();

      if (requestError) throw requestError;
      addTestResult(`✓ Created lesson request for ${dateString}`);

      // Create test ticket
      const ticketNumber = `TEST-${Date.now()}`;
      const { data: ticket, error: ticketError } = await supabase
        .from('lesson_tickets')
        .insert({
          lesson_request_id: lessonRequest.id,
          ticket_number: ticketNumber,
          status: 'pending',
          cfi_id: cfi.id
        })
        .select()
        .single();

      if (ticketError) throw ticketError;
      addTestResult(`✓ Created ticket: ${ticketNumber}`);

      addTestResult('✅ Test data creation completed successfully!');
    } catch (error) {
      console.error('Error creating test data:', error);
      addTestResult(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testTicketFlow = async () => {
    setTesting(true);
    addTestResult('Starting ticket flow test...');
    
    try {
      // Get latest ticket
      const { data: tickets, error: ticketError } = await supabase
        .from('lesson_tickets')
        .select(`
          id,
          ticket_number,
          status,
          lesson_request:lesson_requests(
            id,
            requested_date,
            student:students(first_name, last_name),
            cfi:cfis(first_name, last_name),
            aircraft:aircraft(tail_number)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1);

      if (ticketError) throw ticketError;
      
      if (!tickets || tickets.length === 0) {
        addTestResult('❌ No tickets found for testing');
        return;
      }

      const ticket = tickets[0];
      addTestResult(`✓ Found ticket: ${ticket.ticket_number}`);

      // Test ticket assignment
      const { error: assignError } = await supabase
        .from('lesson_tickets')
        .update({ status: 'assigned' })
        .eq('id', ticket.id);

      if (assignError) throw assignError;
      addTestResult(`✓ Ticket assigned successfully`);

      // Test ticket acceptance
      const { error: acceptError } = await supabase
        .from('lesson_tickets')
        .update({ status: 'accepted' })
        .eq('id', ticket.id);

      if (acceptError) throw acceptError;
      addTestResult(`✓ Ticket accepted successfully`);

      // Test lesson start
      const { error: startError } = await supabase
        .from('lesson_tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticket.id);

      if (startError) throw startError;
      addTestResult(`✓ Lesson started successfully`);

      // Test lesson completion
      const { error: completeError } = await supabase
        .from('lesson_tickets')
        .update({ status: 'completed' })
        .eq('id', ticket.id);

      if (completeError) throw completeError;
      addTestResult(`✓ Lesson completed successfully`);

      addTestResult('✅ Ticket flow test completed successfully!');
    } catch (error) {
      console.error('Error testing ticket flow:', error);
      addTestResult(`❌ Error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const runFullTest = async () => {
    clearResults();
    await createTestData();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await testTicketFlow();
  };

  const cleanupTestData = async () => {
    setTesting(true);
    addTestResult('Starting cleanup...');
    
    try {
      // Delete test tickets
      const { error: ticketError } = await supabase
        .from('lesson_tickets')
        .delete()
        .like('ticket_number', 'TEST-%');

      if (ticketError) throw ticketError;
      addTestResult('✓ Cleaned up test tickets');

      // Delete test lesson requests
      const { error: requestError } = await supabase
        .from('lesson_requests')
        .delete()
        .eq('student_message', 'Test lesson request');

      if (requestError) throw requestError;
      addTestResult('✓ Cleaned up test lesson requests');

      // Delete test data
      await supabase.from('students').delete().eq('email', 'test.student@example.com');
      await supabase.from('cfis').delete().eq('email', 'test.cfi@example.com');
      await supabase.from('aircraft').delete().eq('tail_number', 'N123TEST');
      
      addTestResult('✅ Cleanup completed successfully!');
    } catch (error) {
      console.error('Error cleaning up:', error);
      addTestResult(`❌ Cleanup error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Authenticating...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lesson Request Test System</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.testButton, styles.primaryButton]}
          onPress={runFullTest}
          disabled={testing}
        >
          <Text style={styles.buttonText}>Run Full Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, styles.secondaryButton]}
          onPress={createTestData}
          disabled={testing}
        >
          <Text style={styles.buttonText}>Create Test Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, styles.secondaryButton]}
          onPress={testTicketFlow}
          disabled={testing}
        >
          <Text style={styles.buttonText}>Test Ticket Flow</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, styles.dangerButton]}
          onPress={cleanupTestData}
          disabled={testing}
        >
          <Text style={styles.buttonText}>Cleanup Test Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, styles.neutralButton]}
          onPress={clearResults}
          disabled={testing}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        <ScrollView style={styles.resultsList}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>{result}</Text>
          ))}
          {testing && <Text style={styles.resultText}>⏳ Running test...</Text>}
        </ScrollView>
      </View>
    </View>
  );
}

export default function LessonRequestTestSystem() {
  return (
    <AutoAuthProvider>
      <LessonRequestTestSystemContent />
    </AutoAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  loadingText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 50 },
  buttonContainer: { marginBottom: 20 },
  testButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  primaryButton: { backgroundColor: '#007bff' },
  secondaryButton: { backgroundColor: '#6c757d' },
  dangerButton: { backgroundColor: '#dc3545' },
  neutralButton: { backgroundColor: '#28a745' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  resultsContainer: { flex: 1, backgroundColor: 'white', borderRadius: 8, padding: 15 },
  resultsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  resultsList: { flex: 1 },
  resultText: { fontSize: 14, marginBottom: 5, color: '#333' }
});