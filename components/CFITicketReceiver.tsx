import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import AutoAuthProvider from './AutoAuthProvider';

interface Ticket {
  id: string;
  ticket_number: string;
  status: string;
  created_at: string;
  lesson_request: {
    id: string;
    requested_date: string;
    requested_start_time: string;
    requested_end_time: string;
    student: {
      first_name: string;
      last_name: string;
      email: string;
    };
    aircraft: {
      tail_number: string;
      make: string;
      model: string;
    };
  };
}

function CFITicketReceiverContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const { isAuthenticated, userRole, userId } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadAssignedTickets();
    }
  }, [isAuthenticated, userId]);

  const loadAssignedTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_tickets')
        .select(`
          id,
          ticket_number,
          status,
          created_at,
          lesson_request:lesson_requests(
            id,
            requested_date,
            requested_start_time,
            requested_end_time,
            student:students(
              first_name,
              last_name,
              email
            ),
            aircraft:aircraft(
              tail_number,
              make,
              model
            )
          )
        `)
        .in('status', ['assigned', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading assigned tickets:', error);
      Alert.alert('Error', 'Failed to load assigned tickets');
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setLoading(true);
    try {
      const { error: ticketError } = await supabase
        .from('lesson_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        const { error: requestError } = await supabase
          .from('lesson_requests')
          .update({ status: newStatus })
          .eq('id', ticket.lesson_request.id);

        if (requestError) throw requestError;
      }

      Alert.alert('Success', `Ticket ${newStatus} successfully`);
      loadAssignedTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      Alert.alert('Error', 'Failed to update ticket status');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Authenticating...</Text>
      </View>
    );
  }

  const renderTicket = (ticket: Ticket) => {
    const isExpanded = selectedTicket === ticket.id;
    
    return (
      <View key={ticket.id} style={styles.ticketCard}>
        <TouchableOpacity 
          style={styles.ticketHeader}
          onPress={() => setSelectedTicket(isExpanded ? null : ticket.id)}
        >
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketNumber}>{ticket.ticket_number}</Text>
            <Text style={styles.ticketStatus}>Status: {ticket.status}</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.ticketDetails}>
            <Text style={styles.detailTitle}>Lesson Details:</Text>
            <Text style={styles.detailText}>Student: {ticket.lesson_request.student.first_name} {ticket.lesson_request.student.last_name}</Text>
            <Text style={styles.detailText}>Email: {ticket.lesson_request.student.email}</Text>
            <Text style={styles.detailText}>Date: {new Date(ticket.lesson_request.requested_date).toLocaleDateString()}</Text>
            <Text style={styles.detailText}>Time: {ticket.lesson_request.requested_start_time} - {ticket.lesson_request.requested_end_time}</Text>
            <Text style={styles.detailText}>Aircraft: {ticket.lesson_request.aircraft.tail_number} ({ticket.lesson_request.aircraft.make} {ticket.lesson_request.aircraft.model})</Text>
            
            <View style={styles.actionButtons}>
              {ticket.status === 'assigned' && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => updateTicketStatus(ticket.id, 'accepted')}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => updateTicketStatus(ticket.id, 'rejected')}
                    disabled={loading}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {ticket.status === 'accepted' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => updateTicketStatus(ticket.id, 'in_progress')}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>Start Lesson</Text>
                </TouchableOpacity>
              )}
              {ticket.status === 'in_progress' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => updateTicketStatus(ticket.id, 'completed')}
                  disabled={loading}
                >
                  <Text style={styles.actionButtonText}>Complete Lesson</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CFI Ticket Receiver</Text>
      
      <TouchableOpacity style={styles.refreshButton} onPress={loadAssignedTickets}>
        <Text style={styles.refreshButtonText}>Refresh Tickets</Text>
      </TouchableOpacity>

      <ScrollView style={styles.ticketsList}>
        {tickets.length === 0 ? (
          <Text style={styles.noTicketsText}>No assigned tickets found</Text>
        ) : (
          tickets.map(renderTicket)
        )}
      </ScrollView>
    </View>
  );
}

export default function CFITicketReceiver() {
  return (
    <AutoAuthProvider>
      <CFITicketReceiverContent />
    </AutoAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  loadingText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 50 },
  refreshButton: { backgroundColor: '#45B7D1', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  refreshButtonText: { color: 'white', fontWeight: 'bold' },
  ticketsList: { flex: 1 },
  ticketCard: { backgroundColor: 'white', borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  ticketInfo: { flex: 1 },
  ticketNumber: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  ticketStatus: { fontSize: 14, color: '#666', marginTop: 4 },
  expandIcon: { fontSize: 20, color: '#45B7D1', fontWeight: 'bold' },
  ticketDetails: { padding: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  detailTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  detailText: { fontSize: 14, marginBottom: 5, color: '#333' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  actionButton: { padding: 10, borderRadius: 6, minWidth: 80, alignItems: 'center' },
  acceptButton: { backgroundColor: '#28a745' },
  rejectButton: { backgroundColor: '#dc3545' },
  startButton: { backgroundColor: '#ffc107' },
  completeButton: { backgroundColor: '#17a2b8' },
  actionButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  noTicketsText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 50 }
});