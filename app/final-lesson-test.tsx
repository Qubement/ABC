import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from './lib/supabase';

export default function FinalLessonTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [cfiRequests, setCfiRequests] = useState<any[]>([]);
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    setupAndTest();
  }, []);

  const setupAndTest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get/create student
      let { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!student) {
        const { data: newStudent } = await supabase
          .from('students')
          .insert({ user_id: user.id, first_name: 'Test', last_name: 'Student', email: user.email })
          .select().single();
        student = newStudent;
      }

      // Get/create CFI
      let { data: cfis } = await supabase.from('cfis').select('*').limit(1);
      if (!cfis || cfis.length === 0) {
        const { data: newCFI } = await supabase
          .from('cfis')
          .insert({ name: 'Test CFI', email: 'cfi@test.com', phone: '555-0100' })
          .select().single();
        cfis = [newCFI];
      }

      // Get/create aircraft
      let { data: aircraft } = await supabase.from('aircraft').select('*').limit(1);
      if (!aircraft || aircraft.length === 0) {
        const { data: newAircraft } = await supabase
          .from('aircraft')
          .insert({ tail_number: 'N123TEST', model: 'Cessna 172', year: 2020 })
          .select().single();
        aircraft = [newAircraft];
      }

      setTestData({ student, cfi: cfis[0], aircraft: aircraft[0] });
      
      // Auto-run test
      await runFinalTest({ student, cfi: cfis[0], aircraft: aircraft[0] });
    } catch (error) {
      console.error('Setup error:', error);
    }
  };

  const runFinalTest = async (data = testData) => {
    if (!data) return;
    
    setIsRunning(true);
    const results = [];
    
    try {
      // Submit 10 test requests
      for (let i = 1; i <= 10; i++) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + i);
        
        const requestData = {
          student_id: data.student.id,
          cfi_id: data.cfi.id,
          aircraft_id: data.aircraft.id,
          requested_date: tomorrow.toISOString().split('T')[0],
          requested_start_time: '10:00',
          requested_end_time: '11:00',
          status: 'pending',
          student_message: `FINAL TEST REQUEST #${i} - ${new Date().toISOString()}`
        };

        try {
          const { data: request, error } = await supabase
            .from('lesson_requests')
            .insert(requestData)
            .select().single();

          if (error) throw error;

          results.push({
            test: i,
            success: true,
            requestId: request.id,
            timestamp: new Date().toISOString()
          });
        } catch (error: any) {
          results.push({
            test: i,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
        
        setTestResults([...results]);
        await new Promise(r => setTimeout(r, 200));
      }

      // Check CFI view
      const { data: cfiView } = await supabase
        .from('lesson_requests')
        .select('*')
        .eq('cfi_id', data.cfi.id)
        .eq('status', 'pending');
      
      setCfiRequests(cfiView || []);
      
      const successCount = results.filter(r => r.success).length;
      const visibleCount = cfiView?.length || 0;
      
      Alert.alert(
        successCount === 10 ? '🎉 SUCCESS!' : '⚠️ PARTIAL SUCCESS',
        `Submitted: ${successCount}/10\nVisible to CFI: ${visibleCount}\n\n${successCount === 10 && visibleCount >= 10 ? 'ALL TESTS PASSED! ✅' : 'Check results below'}`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      Alert.alert('Test Error', error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const approveCFIRequest = async (requestId: string) => {
    try {
      await supabase
        .from('lesson_requests')
        .update({ status: 'approved', cfi_message: 'Approved by CFI' })
        .eq('id', requestId);
      
      Alert.alert('Success', 'Request approved!');
      
      // Refresh CFI view
      const { data: cfiView } = await supabase
        .from('lesson_requests')
        .select('*')
        .eq('cfi_id', testData.cfi.id)
        .eq('status', 'pending');
      setCfiRequests(cfiView || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>🎯 FINAL LESSON TEST</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Test Results</Text>
          <Text style={styles.stat}>✅ Success: {successCount}</Text>
          <Text style={styles.stat}>❌ Failed: {failCount}</Text>
          <Text style={styles.stat}>👁️ CFI Visible: {cfiRequests.length}</Text>
          
          <TouchableOpacity
            style={[styles.button, isRunning && styles.disabledButton]}
            onPress={() => runFinalTest()}
            disabled={isRunning}
          >
            <Text style={styles.buttonText}>
              {isRunning ? '🚀 Testing...' : '🚀 Run Test Again'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 CFI Lesson Requests ({cfiRequests.length})</Text>
          {cfiRequests.map(request => (
            <View key={request.id} style={styles.requestCard}>
              <Text style={styles.requestText}>Date: {request.requested_date}</Text>
              <Text style={styles.requestText}>Time: {request.requested_start_time}</Text>
              <Text style={styles.requestText}>Message: {request.student_message}</Text>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => approveCFIRequest(request.id)}
              >
                <Text style={styles.approveButtonText}>✅ Approve</Text>
              </TouchableOpacity>
            </View>
          ))}
          {cfiRequests.length === 0 && (
            <Text style={styles.noRequests}>No pending requests</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧪 Individual Test Results</Text>
          {testResults.map((result, index) => (
            <View key={index} style={[
              styles.resultItem,
              { borderLeftColor: result.success ? '#28a745' : '#dc3545' }
            ]}>
              <Text style={styles.resultTitle}>Test #{result.test}</Text>
              <Text style={[styles.resultStatus, { color: result.success ? '#28a745' : '#dc3545' }]}>
                {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </Text>
              {result.requestId && <Text style={styles.resultDetail}>ID: {result.requestId}</Text>}
              {result.error && <Text style={styles.errorText}>{result.error}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#45B7D1', padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  content: { flex: 1, padding: 20 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  stat: { fontSize: 16, marginBottom: 5 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: '#ccc' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  requestCard: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 10 },
  requestText: { fontSize: 14, marginBottom: 2 },
  approveButton: { backgroundColor: '#28a745', padding: 8, borderRadius: 5, alignItems: 'center', marginTop: 5 },
  approveButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  noRequests: { textAlign: 'center', color: '#666', fontStyle: 'italic' },
  resultItem: { backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, marginBottom: 8, borderLeftWidth: 4 },
  resultTitle: { fontSize: 14, fontWeight: 'bold' },
  resultStatus: { fontSize: 12, fontWeight: 'bold' },
  resultDetail: { fontSize: 12, color: '#666' },
  errorText: { fontSize: 12, color: '#dc3545', fontStyle: 'italic' }
});