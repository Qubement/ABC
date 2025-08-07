import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface TestResult {
  testNumber: number;
  success: boolean;
  error?: string;
  requestId?: string;
  timestamp: string;
}

export default function LessonRequestTestRunnerFixed() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [testCFI, setTestCFI] = useState<any>(null);
  const [testAircraft, setTestAircraft] = useState<any>(null);

  const setupTestData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      setCurrentUser(user);

      // Get or create student profile
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
      setStudentProfile(student);

      // Get or create test CFI
      let { data: cfi, error: cfiError } = await supabase
        .from('cfis')
        .select('*')
        .limit(1)
        .single();

      if (cfiError) {
        const { data: newCFI, error: createCFIError } = await supabase
          .from('cfis')
          .insert({
            name: 'Test CFI',
            email: 'testcfi@example.com',
            phone: '555-0123'
          })
          .select()
          .single();
        
        if (createCFIError) throw createCFIError;
        cfi = newCFI;
      }
      setTestCFI(cfi);

      // Get or create test aircraft
      let { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .limit(1)
        .single();

      if (aircraftError) {
        const { data: newAircraft, error: createAircraftError } = await supabase
          .from('aircraft')
          .insert({
            tail_number: 'N123TEST',
            model: 'Cessna 172',
            year: 2020
          })
          .select()
          .single();
        
        if (createAircraftError) throw createAircraftError;
        aircraft = newAircraft;
      }
      setTestAircraft(aircraft);

      return { student, cfi, aircraft };
    } catch (error) {
      console.error('Setup error:', error);
      throw error;
    }
  };

  const runSingleTest = async (testNumber: number): Promise<TestResult> => {
    try {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + testNumber);
      const dateString = testDate.toISOString().split('T')[0];
      
      const requestData = {
        student_id: studentProfile.id,
        cfi_id: testCFI.id,
        aircraft_id: testAircraft.id,
        requested_date: dateString,
        requested_start_time: '10:00',
        requested_end_time: '11:00',
        status: 'pending',
        student_message: `Test request #${testNumber} - ${new Date().toISOString()}`
      };

      console.log(`Test ${testNumber} - Submitting:`, requestData);

      const { data, error } = await supabase
        .from('lesson_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error(`Test ${testNumber} - Database error:`, error);
        throw error;
      }

      console.log(`Test ${testNumber} - Success:`, data);
      
      return {
        testNumber,
        success: true,
        requestId: data.id,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`Test ${testNumber} - Error:`, error);
      return {
        testNumber,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Setup test data first
      await setupTestData();
      
      const results: TestResult[] = [];
      
      // Run 10 tests sequentially
      for (let i = 1; i <= 10; i++) {
        const result = await runSingleTest(i);
        results.push(result);
        setTestResults([...results]);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      Alert.alert(
        'Test Results',
        `Completed 10 tests:\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('Test runner error:', error);
      Alert.alert('Error', `Test setup failed: ${error.message}`);
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
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
        Lesson Request Test Runner (Fixed)
      </Text>
      
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: isRunning ? '#ccc' : '#28a745',
            padding: 15,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center'
          }}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {isRunning ? 'Running Tests...' : 'Run 10 Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#dc3545',
            padding: 15,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center'
          }}
          onPress={clearResults}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Clear Results</Text>
        </TouchableOpacity>
      </View>
      
      {testResults.length > 0 && (
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Summary</Text>
          <Text style={{ color: '#28a745', fontSize: 16 }}>✅ Successful: {successCount}</Text>
          <Text style={{ color: '#dc3545', fontSize: 16 }}>❌ Failed: {failCount}</Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 5 }}>Total: {testResults.length}</Text>
        </View>
      )}
      
      {testResults.map(result => (
        <View key={result.testNumber} style={{
          backgroundColor: 'white',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
          borderLeftWidth: 4,
          borderLeftColor: result.success ? '#28a745' : '#dc3545'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Test #{result.testNumber}</Text>
            <Text style={{ 
              color: result.success ? '#28a745' : '#dc3545',
              fontWeight: 'bold'
            }}>
              {result.success ? '✅ SUCCESS' : '❌ FAILED'}
            </Text>
          </View>
          
          <Text style={{ color: '#666', fontSize: 12, marginTop: 5 }}>
            {new Date(result.timestamp).toLocaleString()}
          </Text>
          
          {result.requestId && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>
              Request ID: {result.requestId}
            </Text>
          )}
          
          {result.error && (
            <Text style={{ color: '#dc3545', fontSize: 12, marginTop: 5, fontStyle: 'italic' }}>
              Error: {result.error}
            </Text>
          )}
        </View>
      ))}
      
      {testResults.length === 0 && !isRunning && (
        <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>🧪</Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
            Click "Run 10 Tests" to test lesson request functionality
          </Text>
        </View>
      )}
    </ScrollView>
  );
}