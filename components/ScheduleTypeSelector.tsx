import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

interface Entity {
  id: string;
  name: string;
  type: 'student' | 'cfi' | 'aircraft';
}

interface ScheduleTypeSelectorProps {
  onEntitySelect: (entity: { type: 'student' | 'cfi' | 'aircraft', id: string, name: string }) => void;
}

export default function ScheduleTypeSelector({ onEntitySelect }: ScheduleTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<'student' | 'cfi' | 'aircraft' | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntities = async (type: 'student' | 'cfi' | 'aircraft') => {
    setLoading(true);
    try {
      let query;
      let nameField = 'name';
      
      if (type === 'student') {
        query = supabase.from('students').select('id, first_name, last_name');
      } else if (type === 'cfi') {
        query = supabase.from('cfis').select('id, first_name, last_name');
      } else {
        query = supabase.from('aircraft').select('id, tail_number');
        nameField = 'tail_number';
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const formattedEntities = data?.map(item => ({
        id: item.id,
        name: type === 'aircraft' ? item.tail_number : `${item.first_name} ${item.last_name}`,
        type
      })) || [];
      
      setEntities(formattedEntities);
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: 'student' | 'cfi' | 'aircraft') => {
    setSelectedType(type);
    fetchEntities(type);
  };

  if (selectedType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedType(null)}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Select {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}</Text>
        </View>
        
        <FlatList
          data={entities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.entityItem}
              onPress={() => onEntitySelect({ type: item.type, id: item.id, name: item.name })}
            >
              <Text style={styles.entityName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Schedule Type</Text>
      <Text style={styles.subtitle}>Choose what type of schedule you want to manage</Text>
      
      <TouchableOpacity style={styles.typeButton} onPress={() => handleTypeSelect('student')}>
        <Ionicons name="person" size={24} color="#4CAF50" />
        <Text style={styles.typeButtonText}>Student Schedules</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.typeButton} onPress={() => handleTypeSelect('cfi')}>
        <Ionicons name="school" size={24} color="#FF9800" />
        <Text style={styles.typeButtonText}>CFI Schedules</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.typeButton} onPress={() => handleTypeSelect('aircraft')}>
        <Ionicons name="airplane" size={24} color="#2196F3" />
        <Text style={styles.typeButtonText}>Aircraft Schedules</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  typeButton: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  typeButtonText: { fontSize: 18, fontWeight: '600', color: '#333', marginLeft: 15, flex: 1 },
  entityItem: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  entityName: { fontSize: 16, color: '#333' }
});