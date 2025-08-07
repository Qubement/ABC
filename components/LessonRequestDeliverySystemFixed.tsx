import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';

export default function LessonRequestDeliverySystemFixed() {
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryResults, setDeliveryResults] = useState<any[]>([]);
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    setupTestEnvironment();
  }, []);

  const setupTestEnvironment = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Ensure student profile exists
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

      // Ensure CFI exists
      let { data: cfis, error: cfiError } = await supabase
        .from('cfis')
        .select('*')
        .limit(1);

      if (cfiError || !cfis || cfis.length === 0) {
        const { data: newCFI, error: createCFIError } = await supabase
          .from('cfis')
          .insert({
            name: 'Test CFI Instructor',
            email: 'testcfi@flightschool.com',
            phone: '555-0199',
            certificate_number: 'CFI123456'
          })
          .select()
          .single();
        
        if (createCFIError) throw createCFIError;
        cfis = [newCFI];
      }

      // Ensure aircraft exists
      let { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .limit(1);

      if (aircraftError || !aircraft || aircraft.length === 0) {
        const { data: newAircraft, error: createAircraftError } = await supabase
          .from('aircraft')
          .insert({
            tail_number: 'N999TEST',
            model: 'Cessna 172',
            year: 2021,
            hourly_rate: 150
          })
          .select()
          .single();
        
        if (createAircraftError) throw createAircraftError;
        aircraft = [newAircraft];
      }

      setTestData({
        user,
        student,
        cfi: cfis[0],
        aircraft: aircraft[0]
      });

      console.log('Test environment setup complete:', {
        student: student.id,
        cfi: cfis[0].id,
        aircraft: aircraft[0].id
      });

    } catch (error) {
      console.error('Setup error:', error);
      Alert.alert('Setup Error', 'Failed to setup test environment');
    }
  };

  const deliverTestRequest = async () => {
    if (!testData) {
      Alert.alert('Error', 'Test environment not ready');
      return;
    }

    setIsDelivering(true);
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      
      const requestData = {
        student_id: testData.student.id,
        cfi_id: testData.cfi.id,
        aircraft_id: testData.aircraft.id,
        requested_date: dateString,
        requested_start_time: '14:00',
        requested_end_time: '15:00',
        status: 'pending',
        student_message: `DELIVERY TEST - ${new Date().toISOString()}`
      };

      console.log('Delivering test request:', requestData);

      // Insert the request
      const { data: insertedRequest, error: insertError } = await supabase
        .from('lesson_requests')
        .insert(requestData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Request inserted successfully:', insertedRequest);

      // Verify the request was delivered by querying it back
      const { data: verifyRequest, error: verifyError } = await supabase
        .from('lesson_requests')
        .select('*')
        .eq('id', insertedRequest.id)
        .single();

      if (verifyError) {
        console.error('Verification error:', verifyError);
        throw verifyError;
      }

      console.log('Request verified:', verifyRequest);

      // Check if CFI can see the request
      const { data: cfiRequests, error: cfiError } = await supabase
        .from('lesson_requests')
        .select('*')
        .eq('cfi_id', testData.cfi.id)
        .eq('status', 'pending');

      if (cfiError) {
        console.error('CFI query error:', cfiError);
        throw cfiError;
      }

      console.log('CFI can see requests:', cfiRequests?.length || 0);

      const result = {
        success: true,
        requestId: insertedRequest.id,
        timestamp: new Date().toISOString(),
        cfiCanSee: cfiRequests?.some(r => r.id === insertedRequest.id) || false,
        totalCFIRequests: cfiRequests?.length || 0
      };

      setDeliveryResults(prev => [result, ...prev]);

      Alert.alert(
        'SUCCESS! 🎉',
        `Request delivered successfully!\n\nRequest ID: ${insertedRequest.id}\nCFI can see: ${result.cfiCanSee ? 'YES' : 'NO'}\nTotal CFI requests: ${result.totalCFIRequests}`,
        [{ text: 'Excellent!' }]
      );

    } catch (error: any) {
      console.error('Delivery error:', error);
      
      const result = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      setDeliveryResults(prev => [result, ...prev]);
      
      Alert.alert('Delivery Failed', `Error: ${error.message}`);
    } finally {
      setIsDelivering(false);
    }
  };

  const clearResults = () => {
    setDeliveryResults([]);
  };

  const successCount = deliveryResults.filter(r => r.success).length;
  const failCount = deliveryResults.filter(r => !r.success).length;

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
        🚀 Lesson Request Delivery System
      </Text>
      
      {testData && (
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Test Environment Ready</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>Student: {testData.student.first_name} {testData.student.last_name}</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>CFI: {testData.cfi.name}</Text>
          <Text style={{ fontSize: 14, color: '#666' }}>Aircraft: {testData.aircraft.tail_number}</Text>
        </View>
      )}
      
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: isDelivering ? '#ccc' : '#28a745',
            padding: 15,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center'
          }}
          onPress={deliverTestRequest}
          disabled={isDelivering || !testData}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {isDelivering ? '🚀 Delivering...' : '🚀 Deliver Test Request'}
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
          <Text style={{ color: 'white', fontWeight: 'bold' }}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>
      
      {deliveryResults.length > 0 && (
        <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Delivery Results</Text>
          <Text style={{ color: '#28a745', fontSize: 16 }}>✅ Successful: {successCount}</Text>
          <Text style={{ color: '#dc3545', fontSize: 16 }}>❌ Failed: {failCount}</Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 5 }}>Total Attempts: {deliveryResults.length}</Text>
        </View>
      )}
      
      {deliveryResults.map((result, index) => (
        <View key={index} style={{
          backgroundColor: 'white',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
          borderLeftWidth: 4,
          borderLeftColor: result.success ? '#28a745' : '#dc3545'
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Delivery #{deliveryResults.length - index}</Text>
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
          
          {result.success && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 14, color: '#28a745' }}>Request ID: {result.requestId}</Text>
              <Text style={{ fontSize: 14, color: result.cfiCanSee ? '#28a745' : '#ffc107' }}>
                CFI can see: {result.cfiCanSee ? 'YES ✅' : 'NO ⚠️'}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>Total CFI requests: {result.totalCFIRequests}</Text>
            </View>
          )}
          
          {result.error && (
            <Text style={{ color: '#dc3545', fontSize: 12, marginTop: 5, fontStyle: 'italic' }}>
              Error: {result.error}
            </Text>
          )}
        </View>
      ))}
      
      {deliveryResults.length === 0 && (
        <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>🚀</Text>
          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
            Click "Deliver Test Request" to test the delivery system
          </Text>
        </View>
      )}
    </ScrollView>
  );
}