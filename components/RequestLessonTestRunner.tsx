import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface TestResult {
  testNumber: number;
  success: boolean;
  error?: string;
  timestamp: string;
  duration?: number;
}

export default function RequestLessonTestRunner() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(0);

  const runSingleTest = async (testNumber: number): Promise<TestResult> => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get available schedule data for testing
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          id, 
          date, 
          start_time, 
          cfi_id, 
          aircraft_id,
          cfis(name),
          aircraft(tail_number)
        `)
        .eq('is_available', true)
        .limit(1);

      if (scheduleError) {
        throw new Error(`Schedule query error: ${scheduleError.message}`);
      }
      
      if (!schedules || schedules.length === 0) {
        throw new Error('No available schedules found for testing');
      }

      const schedule = schedules[0];
      
      // Validate schedule data
      if (!schedule.cfi_id || !schedule.aircraft_id || !schedule.date || !schedule.start_time) {
        throw new Error('Invalid schedule data - missing required fields');
      }

      // Calculate end time
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      if (isNaN(startTime.getTime())) {
        throw new Error(`Invalid start time format: ${schedule.start_time}`);
      }
      
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const endTimeString = endTime.toTimeString().slice(0, 5);

      // Prepare test data
      const testRequestData = {
        student_id: user.id,
        cfi_id: schedule.cfi_id,
        aircraft_id: schedule.aircraft_id,
        requested_date: schedule.date,
        requested_start_time: schedule.start_time,
        requested_end_time: endTimeString,
        schedule_id: schedule.id,
        status: 'pending'
      };

      // Attempt to insert lesson request
      const { data: insertData, error: insertError } = await supabase
        .from('lesson_requests')
        .insert(testRequestData)
        .select()
        .single();

      if (insertError) {
        throw new Error(`Insert error: ${insertError.message}`);
      }

      if (!insertData) {
        throw new Error('No data returned from insert operation');
      }

      // Clean up test data immediately
      const { error: deleteError } = await supabase
        .from('lesson_requests')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.warn(`Warning: Failed to clean up test data: ${deleteError.message}`);
      }

      const duration = Date.now() - startTime;
      return {
        testNumber,
        success: true,
        timestamp,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        testNumber,
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp,
        duration
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest(0);
    
    const results: TestResult[] = [];
    
    for (let i = 1; i <= 10; i++) {
      setCurrentTest(i);
      const result = await runSingleTest(i);
      results.push(result);
      setTestResults([...results]);
      
      // Small delay between tests to avoid overwhelming the database
      if (i < 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    setIsRunning(false);
    setCurrentTest(0);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    
    Alert.alert(
      'Test Results Summary',
      `Tests completed!\n\n✅ Successful: ${successCount}\n❌ Failed: ${failCount}\n⏱️ Avg Duration: ${avgDuration.toFixed(0)}ms\n\n${failCount === 0 ? '🎉 All tests passed! Send request error is fixed.' : '⚠️ Some tests failed - check results below.'}`
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lesson Request Test Runner</Text>
      <Text style={styles.subtitle}>Verify send request functionality</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, isRunning && styles.disabledButton]} 
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? `Running Test ${currentTest}/10...` : 'Run 10 Tests'}
          </Text>
        </TouchableOpacity>

        {testResults.length > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={clearResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        )}
      </View>

      {testResults.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Results: {successCount} passed, {failCount} failed
          </Text>
          {failCount === 0 && testResults.length === 10 && (
            <Text style={styles.successText}>🎉 All tests passed! Error is fixed.</Text>
          )}
        </View>
      )}

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result) => (
          <View key={result.testNumber} style={[
            styles.resultItem,
            result.success ? styles.successItem : styles.failItem
          ]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                Test {result.testNumber}: {result.success ? '✅ PASS' : '❌ FAIL'}
              </Text>
              {result.duration && (
                <Text style={styles.duration}>{result.duration}ms</Text>
              )}
            </View>
            <Text style={styles.timestamp}>
              {new Date(result.timestamp).toLocaleTimeString()}
            </Text>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20
  },
  button: {
    backgroundColor: '#45B7D1',
    padding: 15,
    borderRadius: 10,
    flex: 1
  },
  clearButton: {
    backgroundColor: '#FF6B35'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6
  },
  summary: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 5
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#28a745',
    fontWeight: 'bold'
  },
  resultsContainer: {
    flex: 1
  },
  resultItem: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  successItem: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1
  },
  failItem: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  duration: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    fontStyle: 'italic'
  }
});