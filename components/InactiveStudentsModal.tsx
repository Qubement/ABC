import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface InactiveStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_certificate_expiry?: string;
  pilot_license_number?: string;
  total_flight_hours?: number;
  solo_hours?: number;
  cross_country_hours?: number;
  night_hours?: number;
  instrument_hours?: number;
  goals?: string;
  notes?: string;
  hourly_rate?: number;
  password?: string;
  profile_completed?: boolean;
  moved_to_inactive_at: string;
}

interface InactiveStudentsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function InactiveStudentsModal({ visible, onClose }: InactiveStudentsModalProps) {
  const [inactiveStudents, setInactiveStudents] = useState<InactiveStudent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchInactiveStudents();
    }
  }, [visible]);

  const fetchInactiveStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inactive_students')
        .select('*')
        .order('moved_to_inactive_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      setInactiveStudents(data || []);
    } catch (error) {
      console.error('Error fetching inactive students:', error);
      Alert.alert('Error', `Failed to fetch inactive students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reactivateStudent = async (student: InactiveStudent) => {
    try {
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          phone: student.phone,
          date_of_birth: student.date_of_birth,
          address: student.address,
          emergency_contact_name: student.emergency_contact_name,
          emergency_contact_phone: student.emergency_contact_phone,
          medical_certificate_expiry: student.medical_certificate_expiry,
          pilot_license_number: student.pilot_license_number,
          total_flight_hours: student.total_flight_hours || 0,
          solo_hours: student.solo_hours || 0,
          cross_country_hours: student.cross_country_hours || 0,
          night_hours: student.night_hours || 0,
          instrument_hours: student.instrument_hours || 0,
          notes: student.notes,
          password: student.password,
          profile_completed: student.profile_completed || false
        });

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from('inactive_students')
        .delete()
        .eq('id', student.id);

      if (deleteError) throw deleteError;

      Alert.alert('Success', `${student.first_name} ${student.last_name} has been reactivated`);
      fetchInactiveStudents();
    } catch (error) {
      console.error('Error reactivating student:', error);
      Alert.alert('Error', `Failed to reactivate student: ${error.message}`);
    }
  };

  const renderStudent = ({ item }: { item: InactiveStudent }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff', marginBottom: 10, borderRadius: 8 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
          {item.email}
        </Text>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          Inactive since: {new Date(item.moved_to_inactive_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#28a745', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 }}
        onPress={() => reactivateStudent(item)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reactivate</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Inactive Students</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 18, color: '#666' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={inactiveStudents}
            renderItem={renderStudent}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 20 }}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                <Text style={{ fontSize: 16, color: '#666' }}>No inactive students found</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}