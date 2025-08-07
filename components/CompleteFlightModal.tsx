import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import DropdownPicker from './DropdownPicker';
import { styles } from './CompleteFlightModalStyles';

interface CompleteFlightModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface CFI {
  id: string;
  first_name: string;
  last_name: string;
}

interface Aircraft {
  id: string;
  tail_number: string;
  make: string;
  model: string;
}

export default function CompleteFlightModal({ visible, onClose, onComplete }: CompleteFlightModalProps) {
  const { userRole, user } = useAuth();
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCFI, setSelectedCFI] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [hobbsIn, setHobbsIn] = useState('');
  const [hobbsOut, setHobbsOut] = useState('');
  const [groundInstruction, setGroundInstruction] = useState('');
  const [description, setDescription] = useState('');
  const [isSolo, setIsSolo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [cfis, setCFIs] = useState<CFI[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');

  const calculateFlightTime = () => {
    if (hobbsIn && hobbsOut) {
      const hobbsInNum = parseFloat(hobbsIn);
      const hobbsOutNum = parseFloat(hobbsOut);
      if (!isNaN(hobbsInNum) && !isNaN(hobbsOutNum) && hobbsOutNum > hobbsInNum) {
        return (hobbsOutNum - hobbsInNum).toFixed(1);
      }
    }
    return '0.0';
  };

  useEffect(() => {
    if (visible) {
      fetchData();
      if (userRole === 'student') {
        fetchCurrentStudent();
      } else if (userRole === 'instructor') {
        fetchCurrentCFI();
      }
    }
  }, [visible, userRole]);

  const fetchCurrentStudent = async () => {
    try {
      const { data } = await supabase.from('students').select('id, first_name, last_name').eq('user_id', user?.id).limit(1);
      if (data && data.length > 0) {
        setCurrentUserId(data[0].id);
        setSelectedStudent(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching current student:', error);
    }
  };

  const fetchCurrentCFI = async () => {
    try {
      const { data } = await supabase.from('cfis').select('id, first_name, last_name').eq('user_id', user?.id).limit(1);
      if (data && data.length > 0) {
        setCurrentUserId(data[0].id);
        setSelectedCFI(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching current CFI:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [studentsRes, cfisRes, aircraftRes] = await Promise.all([
        supabase.from('students').select('id, first_name, last_name'),
        supabase.from('cfis').select('id, first_name, last_name'),
        supabase.from('aircraft').select('id, tail_number, make, model')
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (cfisRes.data) setCFIs(cfisRes.data);
      if (aircraftRes.data) setAircraft(aircraftRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedAircraft || !hobbsIn || !hobbsOut) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseFloat(hobbsOut) <= parseFloat(hobbsIn)) {
      Alert.alert('Error', 'Hobbs Out must be greater than Hobbs In');
      return;
    }

    if (!isSolo && !selectedCFI) {
      Alert.alert('Error', 'Please select a CFI or check Solo flight');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('flight_logs').insert({
        student_id: selectedStudent,
        cfi_id: isSolo ? null : selectedCFI,
        aircraft_id: selectedAircraft,
        flight_date: flightDate,
        hobbs_in: parseFloat(hobbsIn),
        hobbs_out: parseFloat(hobbsOut),
        ground_instruction: groundInstruction ? parseFloat(groundInstruction) : 0,
        is_solo: isSolo,
        description
      });

      if (error) throw error;

      Alert.alert('Success', 'Flight completed successfully');
      resetForm();
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing flight:', error);
      Alert.alert('Error', 'Failed to complete flight');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFlightDate(new Date().toISOString().split('T')[0]);
    if (userRole !== 'student') {
      setSelectedStudent('');
    }
    if (userRole !== 'instructor') {
      setSelectedCFI('');
    }
    setSelectedAircraft('');
    setHobbsIn('');
    setHobbsOut('');
    setGroundInstruction('');
    setDescription('');
    setIsSolo(false);
  };

  const getStudentOptions = () => {
    if (userRole === 'student') {
      return students.filter(s => s.id === currentUserId).map(s => ({
        id: s.id,
        label: `${s.first_name} ${s.last_name}`
      }));
    }
    return students.map(s => ({ id: s.id, label: `${s.first_name} ${s.last_name}` }));
  };

  const getCFIOptions = () => {
    if (userRole === 'instructor') {
      return cfis.filter(c => c.id === currentUserId).map(c => ({
        id: c.id,
        label: `${c.first_name} ${c.last_name}`
      }));
    }
    return cfis.map(c => ({ id: c.id, label: `${c.first_name} ${c.last_name}` }));
  };

  const getAircraftOptions = () => {
    return aircraft.map(a => ({ id: a.id, label: `${a.tail_number} - ${a.make} ${a.model}` }));
  };

  const isStudentFieldDisabled = userRole === 'student';
  const isCFIFieldDisabled = userRole === 'instructor';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Flight</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Flight Date</Text>
          <TextInput
            style={styles.input}
            value={flightDate}
            onChangeText={setFlightDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Student *</Text>
          <DropdownPicker
            items={getStudentOptions()}
            selectedId={selectedStudent}
            onSelect={setSelectedStudent}
            placeholder="Select Student"
            disabled={isStudentFieldDisabled}
          />

          <Text style={styles.label}>Aircraft *</Text>
          <DropdownPicker
            items={getAircraftOptions()}
            selectedId={selectedAircraft}
            onSelect={setSelectedAircraft}
            placeholder="Select Aircraft"
          />

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isSolo && styles.checkboxChecked]}
              onPress={() => setIsSolo(!isSolo)}
            >
              {isSolo && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Solo Flight</Text>
          </View>

          {!isSolo && (
            <>
              <Text style={styles.label}>CFI *</Text>
              <DropdownPicker
                items={getCFIOptions()}
                selectedId={selectedCFI}
                onSelect={setSelectedCFI}
                placeholder="Select CFI"
                disabled={isCFIFieldDisabled}
              />
            </>
          )}

          <Text style={styles.label}>Hobbs In *</Text>
          <TextInput
            style={styles.input}
            value={hobbsIn}
            onChangeText={setHobbsIn}
            placeholder="0.0"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Hobbs Out *</Text>
          <TextInput
            style={styles.input}
            value={hobbsOut}
            onChangeText={setHobbsOut}
            placeholder="0.0"
            keyboardType="decimal-pad"
          />

          <View style={styles.flightTimeContainer}>
            <Text style={styles.flightTimeLabel}>Flight Time:</Text>
            <Text style={styles.flightTimeValue}>{calculateFlightTime()} hours</Text>
          </View>

          <Text style={styles.label}>Ground Instruction Received</Text>
          <TextInput
            style={styles.input}
            value={groundInstruction}
            onChangeText={setGroundInstruction}
            placeholder="0.0"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Flight description..."
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Completing...' : 'Complete Flight'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}