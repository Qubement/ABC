import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface TicketData {
  id: string;
  ticket_number: string;
  lesson_request_id: string;
  student_id: string;
  cfi_id: string;
  aircraft_id: string;
  status: string;
  created_at: string;
  ticket_data: any;
}

export default function TicketStorageSystem() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      Alert.alert('Error', 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const generateTicket = async (lessonRequestId: string) => {
    try {
      const ticketNumber = `LR${Date.now()}`;
      const ticketData = {
        studentName: 'Test Student',
        cfiName: 'Test CFI',
        aircraftInfo: 'Test Aircraft',
        requestedDate: new Date().toISOString().split('T')[0],
        requestedTime: '10:00 AM',
        studentMessage: 'Test lesson request'
      };

      const { data, error } = await supabase
        .from('lesson_tickets')
        .insert({
          ticket_number: ticketNumber,
          lesson_request_id: lessonRequestId,
          student_id: '00000000-0000-0000-0000-000000000000',
          cfi_id: '00000000-0000-0000-0000-000000000000',
          aircraft_id: '00000000-0000-0000-0000-000000000000',
          status: 'pending',
          ticket_data: ticketData
        })
        .select()
        .single();

      if (error) throw error;
      Alert.alert('Success', `Ticket ${ticketNumber} generated!`);
      fetchTickets();
    } catch (error) {
      console.error('Error generating ticket:', error);
      Alert.alert('Error', 'Failed to generate ticket');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lesson Request Tickets</Text>
      
      <TouchableOpacity 
        style={styles.generateButton}
        onPress={() => generateTicket('test-request-id')}
      >
        <Text style={styles.buttonText}>Generate Test Ticket</Text>
      </TouchableOpacity>

      {tickets.map((ticket) => (
        <View key={ticket.id} style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketNumber}>#{ticket.ticket_number}</Text>
            <Text style={[styles.status, { color: ticket.status === 'pending' ? '#ffc107' : '#28a745' }]}>
              {ticket.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.ticketDate}>
            Created: {new Date(ticket.created_at).toLocaleDateString()}
          </Text>
          {ticket.ticket_data && (
            <View style={styles.ticketDetails}>
              <Text>Student: {ticket.ticket_data.studentName}</Text>
              <Text>CFI: {ticket.ticket_data.cfiName}</Text>
              <Text>Aircraft: {ticket.ticket_data.aircraftInfo}</Text>
              <Text>Date: {ticket.ticket_data.requestedDate}</Text>
              <Text>Time: {ticket.ticket_data.requestedTime}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  generateButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, marginBottom: 16 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  ticketCard: { backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ticketNumber: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 14, fontWeight: 'bold' },
  ticketDate: { fontSize: 12, color: '#666', marginBottom: 8 },
  ticketDetails: { gap: 4 }
});