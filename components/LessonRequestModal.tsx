import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';
import RollerPicker from './RollerPicker';

interface CFI {
  id: string;
  first_name: string;
  last_name: string;
}

interface Aircraft {
  id: string;
  tail_number: string;
  model: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  studentId: string;
}

export default function LessonRequestModal({ visible, onClose, studentId }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCFI, setSelectedCFI] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [availableCFIs, setAvailableCFIs] = useState<CFI[]>([]);
  const [availableAircraft, setAvailableAircraft] = useState<Aircraft[]>([]);
  const [timeSlots] = useState<TimeSlot[]>([
    { start_time: '08:00', end_time: '09:00' },
    { start_time: '09:00', end_time: '10:00' },
    { start_time: '10:00', end_time: '11:00' },
    { start_time: '11:00', end_time: '12:00' },
    { start_time: '13:00', end_time: '14:00' },
    { start_time: '14:00', end_time: '15:00' },
    { start_time: '15:00', end_time: '16:00' },
    { start_time: '16:00', end_time: '17:00' }
  ]);
  const [loading, setLoading] = useState(false);

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        id: date.toISOString().split('T')[0],
        label: date.toLocaleDateString()
      });
    }
    return dates;
  };

  const getTimeSlotItems = () => {
    return timeSlots.map(slot => ({
      id: slot.start_time,
      label: `${slot.start_time} - ${slot.end_time}`
    }));
  };

  const getCFIItems = () => {
    return availableCFIs.map(cfi => ({
      id: cfi.id,
      label: `${cfi.first_name} ${cfi.last_name}`
    }));
  };

  const getAircraftItems = () => {
    return availableAircraft.map(aircraft => ({
      id: aircraft.id,
      label: `${aircraft.tail_number} - ${aircraft.model}`
    }));
  };

  useEffect(() => {
    if (selectedDate && selectedTime) {
      fetchAvailableCFIs();
      fetchAvailableAircraft();
    }
  }, [selectedDate, selectedTime]);

  const fetchAvailableCFIs = async () => {
    try {
      console.log('Fetching CFIs for date:', selectedDate, 'time:', selectedTime);
      
      // Get all CFIs with complete profiles
      const { data: cfis, error: cfiError } = await supabase
        .from('cfis')
        .select('id, first_name, last_name')
        .eq('profile_completed', true);
      
      if (cfiError) {
        console.error('Error fetching CFIs:', cfiError);
        return;
      }
      
      console.log('All CFIs:', cfis);
      
      // Get blocked CFIs for this date/time
      const { data: blocked, error: blockedError } = await supabase
        .from('availability_blocks')
        .select('entity_id')
        .eq('entity_type', 'cfi')
        .eq('date', selectedDate)
        .eq('start_time', selectedTime)
        .eq('is_available', false);
      
      if (blockedError) {
        console.error('Error fetching blocked CFIs:', blockedError);
      }
      
      console.log('Blocked CFIs:', blocked);
      
      const blockedIds = blocked?.map(b => b.entity_id) || [];
      const available = cfis?.filter(cfi => !blockedIds.includes(cfi.id)) || [];
      
      console.log('Available CFIs:', available);
      setAvailableCFIs(available);
    } catch (error) {
      console.error('Error in fetchAvailableCFIs:', error);
      setAvailableCFIs([]);
    }
  };

  const fetchAvailableAircraft = async () => {
    try {
      const { data: aircraft } = await supabase.from('aircraft').select('id, tail_number, model');
      const { data: blocked } = await supabase
        .from('availability_blocks')
        .select('entity_id')
        .eq('entity_type', 'aircraft')
        .eq('date', selectedDate)
        .eq('start_time', selectedTime)
        .eq('is_available', false);
      
      const blockedIds = blocked?.map(b => b.entity_id) || [];
      const available = aircraft?.filter(a => !blockedIds.includes(a.id)) || [];
      setAvailableAircraft(available);
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedDate || !selectedTime || !selectedCFI || !selectedAircraft) {
      Alert.alert('Error', 'Please select all fields');
      return;
    }

    setLoading(true);
    try {
      const timeSlot = timeSlots.find(t => t.start_time === selectedTime);
      const { error } = await supabase
        .from('lesson_requests')
        .insert({
          student_id: studentId,
          cfi_id: selectedCFI,
          aircraft_id: selectedAircraft,
          requested_date: selectedDate,
          requested_start_time: selectedTime,
          requested_end_time: timeSlot?.end_time || selectedTime,
          status: 'pending'
        });

      if (error) throw error;
      
      Alert.alert('Success', 'Lesson request sent!');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={{ backgroundColor: '#45B7D1', padding: 20, paddingTop: 50 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Request Lesson</Text>
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 20, top: 50 }}>
            <Text style={{ color: 'white', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Select Date</Text>
          <RollerPicker
            items={generateDates()}
            selectedId={selectedDate}
            onSelect={setSelectedDate}
            placeholder="Choose a date"
            maxHeight={200}
          />
          
          {selectedDate && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Select Time</Text>
              <RollerPicker
                items={getTimeSlotItems()}
                selectedId={selectedTime}
                onSelect={setSelectedTime}
                placeholder="Choose a time slot"
                maxHeight={200}
              />
            </View>
          )}
          
          {selectedDate && selectedTime && (
            <>
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Select CFI</Text>
                {availableCFIs.length === 0 ? (
                  <Text style={{ color: '#666', fontStyle: 'italic', padding: 10 }}>No CFIs available for this time slot</Text>
                ) : (
                  <RollerPicker
                    items={getCFIItems()}
                    selectedId={selectedCFI}
                    onSelect={setSelectedCFI}
                    placeholder="Choose a CFI"
                    maxHeight={150}
                  />
                )}
              </View>
              
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Select Aircraft</Text>
                {availableAircraft.length === 0 ? (
                  <Text style={{ color: '#666', fontStyle: 'italic', padding: 10 }}>No aircraft available for this time slot</Text>
                ) : (
                  <RollerPicker
                    items={getAircraftItems()}
                    selectedId={selectedAircraft}
                    onSelect={setSelectedAircraft}
                    placeholder="Choose an aircraft"
                    maxHeight={150}
                  />
                )}
              </View>
            </>
          )}
          
          <TouchableOpacity
            style={{
              backgroundColor: '#45B7D1',
              padding: 15,
              borderRadius: 8,
              alignItems: 'center',
              marginTop: 30,
              marginBottom: 20,
              opacity: loading || !selectedDate || !selectedTime || !selectedCFI || !selectedAircraft ? 0.6 : 1
            }}
            onPress={handleSendRequest}
            disabled={loading || !selectedDate || !selectedTime || !selectedCFI || !selectedAircraft}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              {loading ? 'Sending...' : 'Send Request'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}