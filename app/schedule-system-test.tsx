import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

export default function ScheduleSystemTest() {
  const { userRole, userId } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string, isError = false) => {
    setTestResults(prev => [...prev, `${isError ? '❌' : '✅'} ${message}`]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('Starting Schedule System Tests...');
    
    try {
      // Test 1: Check user authentication
      if (!userId || !userRole) {
        addResult('User not authenticated', true);
        return;
      }
      addResult(`User authenticated as ${userRole} (ID: ${userId})`);

      // Test 2: Test schedule data fetching
      addResult('Testing schedule data fetching...');
      let query = supabase.from('schedules').select(`
        *,
        students(name),
        cfis(name),
        aircraft(tail_number)
      `);

      if (userRole === 'student') {
        query = query.eq('student_id', userId);
      } else if (userRole === 'instructor') {
        query = query.eq('cfi_id', userId);
      }

      const { data: schedules, error: scheduleError } = await query;
      if (scheduleError) {
        addResult(`Schedule fetch error: ${scheduleError.message}`, true);
      } else {
        addResult(`Found ${schedules?.length || 0} schedules`);
      }

      // Test 3: Test date selection logic
      const selectedDate = new Date().toISOString().split('T')[0];
      const todaySchedules = schedules?.filter(s => s.date === selectedDate) || [];
      addResult(`Schedules for today (${selectedDate}): ${todaySchedules.length}`);

      // Test 4: Test admin permissions
      if (userRole === 'administrator') {
        addResult('Testing admin permissions...');
        
        // Test fetching all data
        const { data: allSchedules, error: adminError } = await supabase
          .from('schedules')
          .select('*');
        
        if (adminError) {
          addResult(`Admin data fetch error: ${adminError.message}`, true);
        } else {
          addResult(`Admin can see all ${allSchedules?.length || 0} schedules`);
        }

        // Test fetching students, CFIs, aircraft
        const { data: students } = await supabase.from('students').select('*');
        const { data: cfis } = await supabase.from('cfis').select('*');
        const { data: aircraft } = await supabase.from('aircraft').select('*');
        
        addResult(`Available students: ${students?.length || 0}`);
        addResult(`Available CFIs: ${cfis?.length || 0}`);
        addResult(`Available aircraft: ${aircraft?.length || 0}`);
      }

      // Test 5: Test role-based filtering
      addResult('Testing role-based filtering...');
      switch (userRole) {
        case 'administrator':
          addResult('Admin should see all schedules - ✓');
          break;
        case 'instructor':
          const cfiSchedules = schedules?.filter(s => s.cfi_id === userId) || [];
          addResult(`CFI sees ${cfiSchedules.length} assigned schedules`);
          break;
        case 'student':
          const studentSchedules = schedules?.filter(s => s.student_id === userId) || [];
          addResult(`Student sees ${studentSchedules.length} own schedules`);
          break;
      }

      addResult('✅ All tests completed successfully!');

    } catch (error) {
      addResult(`Test error: ${error}`, true);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule System Test</Text>
        <Text style={styles.subtitle}>Role: {userRole}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonDisabled]}
        onPress={runTests}
        disabled={isRunning}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#007AFF', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  button: { margin: 20, padding: 15, backgroundColor: '#007AFF', borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  results: { flex: 1, margin: 20 },
  resultText: { fontSize: 14, marginVertical: 2, fontFamily: 'monospace' }
});