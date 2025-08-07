import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';

interface FlightLog {
  id: string;
  flight_date: string;
  aircraft: { tail_number: string; make: string; model: string };
  cfi: { first_name: string; last_name: string } | null;
  hobbs_in: number;
  hobbs_out: number;
  flight_time: number;
  is_solo: boolean;
  description: string;
}

interface StudentFinancialSpreadsheetProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export default function StudentFinancialSpreadsheet({ studentId, studentName, onClose }: StudentFinancialSpreadsheetProps) {
  const [flightLogs, setFlightLogs] = useState<FlightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [totalSoloHours, setTotalSoloHours] = useState(0);
  const [totalDualHours, setTotalDualHours] = useState(0);

  useEffect(() => {
    fetchFlightLogs();
  }, [studentId]);

  const fetchFlightLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('flight_logs')
        .select(`
          *,
          aircraft:aircraft_id(tail_number, make, model),
          cfi:cfi_id(first_name, last_name)
        `)
        .eq('student_id', studentId)
        .order('flight_date', { ascending: false });

      if (error) throw error;

      setFlightLogs(data || []);
      
      // Calculate totals
      const total = data?.reduce((sum, log) => sum + log.flight_time, 0) || 0;
      const soloTotal = data?.filter(log => log.is_solo).reduce((sum, log) => sum + log.flight_time, 0) || 0;
      const dualTotal = data?.filter(log => !log.is_solo).reduce((sum, log) => sum + log.flight_time, 0) || 0;
      
      setTotalHours(total);
      setTotalSoloHours(soloTotal);
      setTotalDualHours(dualTotal);
    } catch (error) {
      console.error('Error fetching flight logs:', error);
      Alert.alert('Error', 'Failed to load flight logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{studentName} - Flight Log</Text>
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalHours.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalDualHours.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Dual Hours</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalSoloHours.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Solo Hours</Text>
        </View>
      </View>

      <ScrollView style={styles.logSection}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
          <Text style={[styles.headerCell, styles.aircraftCol]}>Aircraft</Text>
          <Text style={[styles.headerCell, styles.cfiCol]}>CFI</Text>
          <Text style={[styles.headerCell, styles.timeCol]}>Time</Text>
        </View>
        
        {flightLogs.map((log) => (
          <View key={log.id} style={styles.tableRow}>
            <Text style={[styles.cell, styles.dateCol]}>{formatDate(log.flight_date)}</Text>
            <Text style={[styles.cell, styles.aircraftCol]}>
              {log.aircraft?.tail_number || 'N/A'}
            </Text>
            <Text style={[styles.cell, styles.cfiCol]}>
              {log.is_solo ? 'SOLO' : (log.cfi ? `${log.cfi.first_name} ${log.cfi.last_name}` : 'N/A')}
            </Text>
            <Text style={[styles.cell, styles.timeCol]}>{log.flight_time.toFixed(1)}</Text>
          </View>
        ))}
        
        {flightLogs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No flight logs found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
    flex: 1,
  },
  summarySection: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#45B7D1',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  logSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cell: {
    fontSize: 13,
    color: '#333',
  },
  dateCol: {
    flex: 2,
  },
  aircraftCol: {
    flex: 2,
  },
  cfiCol: {
    flex: 2,
  },
  timeCol: {
    flex: 1,
    textAlign: 'right',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});