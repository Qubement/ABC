import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from './lib/supabase';

export default function ComprehensiveLessonTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testEnvironment, setTestEnvironment] = useState<any>(null);

  const setupTestEnvironment = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      let { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (studentError) {
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert({
            user_id: user.id,
            first_name: 'Test',
            last_name: 'Student',
            email: user.email || 'test@example.com'
          })
          .select()
          .single();
        
        if (createError) throw createError;
        student = newStudent;
      }

      let { data: cfi, error: cfiError } = await supabase
        .from('cfis')
        .select('*')
        .limit(1)
        .single();

      if (cfiError) {
        const { data: newCFI, error: createCFIError } = await supabase
          .from('cfis')
          .insert({
            name: 'Test CFI Master',
            email: 'testcfi@flightacademy.com',
            phone: '555-0199'
          })
          .select()
          .single();
        
        if (createCFIError) throw createCFIError;
        cfi = newCFI;
      }

      let { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .limit(1)
        .single();

      if (aircraftError) {
        const { data: newAircraft, error: createAircraftError } = await supabase
          .from('aircraft')
          .insert({
            tail_number: 'N888TEST',
            model: 'Cessna 172SP',
            year: 2022
          })
          .select()
          .single();
        
        if (createAircraftError) throw createAircraftError;
        aircraft = newAircraft;
      }

      const environment = { user, student, cfi, aircraft };
      setTestEnvironment(environment);
      return environment;
    } catch (error) {
      console.error('Environment setup error:', error);
      throw error;
    }
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      const env = await setupTestEnvironment();
      const results = [];
      
      for (let i = 1; i <= 10; i++) {
        try {
          const testDate = new Date();
          testDate.setDate(testDate.getDate() + i);
          const dateString = testDate.toISOString().split('T')[0];
          
          const requestData = {
            student_id: env.student.id,
            cfi_id: env.cfi.id,
            aircraft_id: env.aircraft.id,
            requested_date: dateString,
            requested_start_time: `${9 + i}:00`,
            requested_end_time: `${10 + i}:00`,
            status: 'pending',
            student_message: `Test request #${i}`
          };

          const { data: request, error: requestError } = await supabase
            .from('lesson_requests')
            .insert(requestData)
            .select()
            .single();

          if (requestError) throw requestError;

          const { data: cfiView, error: cfiError } = await supabase
            .from('lesson_requests')
            .select('*')
            .eq('id', request.id)
            .eq('cfi_id', env.cfi.id)
            .single();

          if (cfiError) throw cfiError;

          results.push({
            testNumber: i,
            success: true,
            requestId: request.id,
            cfiCanSee: !!cfiView,
            timestamp: new Date().toISOString()
          });
          
        } catch (error: any) {
          results.push({
            testNumber: i,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
        
        setTestResults([...results]);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const successCount = results.filter(r => r.success).length;
      
      Alert.alert(
        'Test Complete!',
        `Results: ${successCount}/10 successful`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      Alert.alert('Test Failed', `Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Comprehensive Test</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.controlsCard}>
          <TouchableOpacity
            style={[styles.runButton, isRunning && styles.disabledButton]}
            onPress={runComprehensiveTest}
            disabled={isRunning}
          >
            <Text style={styles.runButtonText}>
              {isRunning ? 'Running Tests...' : 'Run 10 Tests'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>
        
        {testResults.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Test Summary</Text>
            <Text style={styles.successText}>Success: {successCount}</Text>
            <Text style={styles.failText}>Failed: {failCount}</Text>
          </View>
        )}
        
        {testResults.map((result, index) => (
          <View key={index} style={[
            styles.resultCard,
            { borderLeftColor: result.success ? '#28a745' : '#dc3545' }
          ]}>
            <Text style={styles.resultTitle}>Test #{result.testNumber}</Text>
            <Text style={[
              styles.resultStatus,
              { color: result.success ? '#28a745' : '#dc3545' }
            ]}>
              {result.success ? 'SUCCESS' : 'FAILED'}
            </Text>
            {result.requestId && (
              <Text style={styles.resultDetail}>ID: {result.requestId}</Text>
            )}
            {result.error && (
              <Text style={styles.errorText}>Error: {result.error}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#45B7D1', padding: 20, paddingTop: 60, flexDirection: 'row', alignItems: 'center' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  content: { flex: 1, padding: 20 },
  controlsCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  runButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  disabledButton: { backgroundColor: '#ccc' },
  runButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  clearButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 8, alignItems: 'center' },
  clearButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  summaryCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 15 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  successText: { color: '#28a745', fontSize: 16 },
  failText: { color: '#dc3545', fontSize: 16 },
  resultCard: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4 },
  resultTitle: { fontSize: 16, fontWeight: 'bold' },
  resultStatus: { fontSize: 14, fontWeight: 'bold' },
  resultDetail: { fontSize: 12, color: '#666' },
  errorText: { fontSize: 12, color: '#dc3545', fontStyle: 'italic' }
});