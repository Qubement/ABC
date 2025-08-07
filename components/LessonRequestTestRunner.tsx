import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface TestResult {
  testNumber: number;
  success: boolean;
  message: string;
  timestamp: string;
  requestId?: string;
}

export default function LessonRequestTestRunner() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [availableCFIs, setAvailableCFIs] = useState<any[]>([]);
  const [availableAircraft, setAvailableAircraft] = useState<any[]>([]);

  const setupTestData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      // Get student profile
      if (user) {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (studentError) throw studentError;
        setStudentProfile(student);
      }

      // Get CFIs
      const { data: cfis, error: cfiError } = await supabase
        .from('cfis')
        .select('*')
        .eq('profile_completed', true);
      
      if (cfiError) throw cfiError;
      setAvailableCFIs(cfis || []);

      // Get aircraft
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*');
      
      if (aircraftError) throw aircraftError;
      setAvailableAircraft(aircraft || []);

      return { user, student: studentProfile, cfis: cfis || [], aircraft: aircraft || [] };
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  };

  const runSingleTest = async (testNumber: number): Promise<TestResult> => {
    const timestamp = new Date().toISOString();
    
    try {
      const { user, student, cfis, aircraft } = await setupTestData();
      
      if (!user || !student || cfis.length === 0 || aircraft.length === 0) {
        throw new Error('Missing required data: user, student profile, CFIs, or aircraft');
      }

      // Generate test data
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + Math.floor(Math.random() * 7) + 1);
      const dateString = testDate.toISOString().split('T')[0];
      
      const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
      const selectedTime = times[Math.floor(Math.random() * times.length)];
      
      const startTime = new Date(`2000-01-01T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      const selectedCFI = cfis[Math.floor(Math.random() * cfis.length)];
      const selectedAircraft = aircraft[Math.floor(Math.random() * aircraft.length)];
      
      const requestData = {
        student_id: student.id,
        cfi_id: selectedCFI.id,
        aircraft_id: selectedAircraft.id,
        requested_date: dateString,
        requested_start_time: selectedTime,
        requested_end_time: endTimeString,
        status: 'pending',
        student_message: `Test lesson request #${testNumber}`
      };

      console.log(`Test ${testNumber} - Submitting:`, requestData);

      const { data, error } = await supabase
        .from('lesson_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error(`Test ${testNumber} - Database error:`, error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      console.log(`Test ${testNumber} - Success:`, data);
      
      return {
        testNumber,
        success: true,
        message: `Successfully created lesson request for ${selectedCFI.first_name} ${selectedCFI.last_name} on ${dateString} at ${selectedTime}`,
        timestamp,
        requestId: data.id
      };
    } catch (error: any) {
      console.error(`Test ${testNumber} - Error:`, error);
      return {
        testNumber,
        success: false,
        message: error.message || 'Unknown error occurred',
        timestamp
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: TestResult[] = [];
    
    for (let i = 1; i <= 10; i++) {
      const result = await runSingleTest(i);
      results.push(result);
      setTestResults([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
    
    // Show summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    Alert.alert(
      'Test Results',
      `Tests completed!\n\nSuccessful: ${successCount}\nFailed: ${failCount}\n\nCheck the detailed results below.`
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Lesson Request Test Runner</Text>
      
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <TouchableOpacity
          style={{ backgroundColor: isRunning ? '#ccc' : '#45B7D1', padding: 15, borderRadius: 8, flex: 1 }}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            {isRunning ? 'Running Tests...' : 'Run 10 Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ backgroundColor: '#6c757d', padding: 15, borderRadius: 8, flex: 1 }}
          onPress={clearResults}
          disabled={isRunning}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {testResults.length > 0 && (
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Summary</Text>
          <Text style={{ color: '#28a745', fontSize: 16 }}>✓ Successful: {successCount}</Text>
          <Text style={{ color: '#dc3545', fontSize: 16 }}>✗ Failed: {failCount}</Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 5 }}>Success Rate: {testResults.length > 0 ? Math.round((successCount / testResults.length) * 100) : 0}%</Text>
        </View>
      )}

      {testResults.map((result, index) => (
        <View key={index} style={{ 
          backgroundColor: result.success ? '#d4edda' : '#f8d7da', 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 10,
          borderLeft: `4px solid ${result.success ? '#28a745' : '#dc3545'}`
        }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
            Test {result.testNumber} - {result.success ? 'SUCCESS' : 'FAILED'}
          </Text>
          <Text style={{ marginBottom: 3 }}>{result.message}</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>{result.timestamp}</Text>
          {result.requestId && (
            <Text style={{ fontSize: 12, color: '#666' }}>Request ID: {result.requestId}</Text>
          )}
        </View>
      ))}
      
      {testResults.length === 0 && !isRunning && (
        <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ textAlign: 'center', color: '#666', fontSize: 16 }}>No tests run yet</Text>
          <Text style={{ textAlign: 'center', color: '#999', fontSize: 14, marginTop: 5 }}>Click "Run 10 Tests" to start testing</Text>
        </View>
      )}
    </ScrollView>
  );
}