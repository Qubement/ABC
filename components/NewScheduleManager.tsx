import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';

interface Student {
  id: string;
  name: string;
}

interface CFI {
  id: string;
  name: string;
}

interface Aircraft {
  id: string;
  tail_number: string;
}

interface NewScheduleManagerProps {
  visible: boolean;
  onClose: () => void;
  onScheduleCreated: () => void;
  editingSchedule?: any;
  selectedDate?: string;
}

export default function NewScheduleManager({ 
  visible, 
  onClose, 
  onScheduleCreated,
  editingSchedule,
  selectedDate
}: NewScheduleManagerProps) {
  const { userRole, userId } = useAuth();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCFI, setSelectedCFI] = useState('');
  const [selectedAircraft, setSelectedAircraft] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [cfis, setCfis] = useState<CFI[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
      if (editingSchedule) {
        populateEditData();
      } else {
        clearForm();
      }
    }
  }, [visible, editingSchedule]);

  const loadData = async () => {
    try {
      const [studentsRes, cfisRes, aircraftRes] = await Promise.all([
        supabase.from('students').select('id, name'),
        supabase.from('cfis').select('id, name'),
        supabase.from('aircraft').select('id, tail_number')
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (cfisRes.data) setCfis(cfisRes.data);
      if (aircraftRes.data) setAircraft(aircraftRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const populateEditData = () => {
    if (editingSchedule) {
      setDate(editingSchedule.date);
      setStartTime(editingSchedule.start_time);
      setEndTime(editingSchedule.end_time);
      setSelectedStudent(editingSchedule.student_id);
      setSelectedCFI(editingSchedule.cfi_id);
      setSelectedAircraft(editingSchedule.aircraft_id);
    }
  };

  const clearForm = () => {
    // Pre-fill date if selectedDate is provided and not editing
    setDate(selectedDate || '');
    setStartTime('');
    setEndTime('');
    setSelectedStudent('');
    setSelectedCFI('');
    setSelectedAircraft('');
  };

  const checkConflicts = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('date', date)
        .neq('status', 'canceled')
        .neq('id', editingSchedule?.id || '');

      if (error) throw error;

      const conflicts = data?.filter(schedule => {
        const scheduleStart = schedule.start_time;
        const scheduleEnd = schedule.end_time;
        
        const hasTimeOverlap = (
          (startTime >= scheduleStart && startTime < scheduleEnd) ||
          (endTime > scheduleStart && endTime <= scheduleEnd) ||
          (startTime <= scheduleStart && endTime >= scheduleEnd)
        );

        return hasTimeOverlap && (
          schedule.cfi_id === selectedCFI ||
          schedule.aircraft_id === selectedAircraft
        );
      });

      return conflicts || [];
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  };

  const handleSave = async () => {
    if (!date || !startTime || !endTime || !selectedStudent || !selectedCFI || !selectedAircraft) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    setLoading(true);

    try {
      // Check for conflicts
      const conflicts = await checkConflicts();
      
      if (conflicts.length > 0) {
        if (userRole === 'administrator') {
          // Admin can override conflicts - show warning but allow
          Alert.alert(
            'Conflict Warning',
            `This time slot conflicts with ${conflicts.length} existing schedule(s). As an administrator, you can override this conflict. Continue?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Override & Save', onPress: () => saveSchedule() }
            ]
          );
          setLoading(false);
          return;
        } else {
          Alert.alert(
            'Conflict Detected',
            'This time slot conflicts with existing schedules. Please choose a different time.'
          );
          setLoading(false);
          return;
        }
      }

      await saveSchedule();
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const saveSchedule = async () => {
    try {
      const scheduleData = {
        date,
        start_time: startTime,
        end_time: endTime,
        student_id: selectedStudent,
        cfi_id: selectedCFI,
        aircraft_id: selectedAircraft,
        status: userRole === 'student' ? 'pending' : 'approved',
        created_by: userId
      };

      let result;
      if (editingSchedule) {
        result = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);
      } else {
        result = await supabase
          .from('schedules')
          .insert([scheduleData]);
      }

      if (result.error) throw result.error;

      Alert.alert('Success', `Schedule ${editingSchedule ? 'updated' : 'created'} successfully`);
      onScheduleCreated();
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'Failed to save schedule');
    }
  };

  const canCreateSchedule = () => {
    return userRole === 'administrator' || userRole === 'instructor' || userRole === 'student';
  };

  if (!canCreateSchedule()) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Start Time</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="HH:MM"
          />

          <Text style={styles.label}>End Time</Text>
          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="HH:MM"
          />

          <Text style={styles.label}>Student</Text>
          <View style={styles.pickerContainer}>
            {students.map(student => (
              <TouchableOpacity
                key={student.id}
                style={[
                  styles.pickerItem,
                  selectedStudent === student.id && styles.selectedItem
                ]}
                onPress={() => setSelectedStudent(student.id)}
              >
                <Text style={[
                  styles.pickerText,
                  selectedStudent === student.id && styles.selectedText
                ]}>
                  {student.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>CFI</Text>
          <View style={styles.pickerContainer}>
            {cfis.map(cfi => (
              <TouchableOpacity
                key={cfi.id}
                style={[
                  styles.pickerItem,
                  selectedCFI === cfi.id && styles.selectedItem
                ]}
                onPress={() => setSelectedCFI(cfi.id)}
              >
                <Text style={[
                  styles.pickerText,
                  selectedCFI === cfi.id && styles.selectedText
                ]}>
                  {cfi.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Aircraft</Text>
          <View style={styles.pickerContainer}>
            {aircraft.map(ac => (
              <TouchableOpacity
                key={ac.id}
                style={[
                  styles.pickerItem,
                  selectedAircraft === ac.id && styles.selectedItem
                ]}
                onPress={() => setSelectedAircraft(ac.id)}
              >
                <Text style={[
                  styles.pickerText,
                  selectedAircraft === ac.id && styles.selectedText
                ]}>
                  {ac.tail_number}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 10 },
  closeButtonText: { fontSize: 18, color: '#666' },
  form: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, maxHeight: 120 },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  selectedItem: { backgroundColor: '#007AFF' },
  pickerText: { fontSize: 16 },
  selectedText: { color: 'white' },
  saveButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  disabledButton: { backgroundColor: '#ccc' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});