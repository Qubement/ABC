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
    cfi: {
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

interface CFI {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

function AdminTicketDashboardContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cfis, setCfis] = useState<CFI[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const { isAuthenticated, userRole } = useAuth();

  useEffect(() => {
    if (isAuthenticated && userRole === 'administrator') {
      loadTickets();
      loadCFIs();
    }
  }, [isAuthenticated, userRole]);

  const loadTickets = async () => {
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
            cfi:cfis(
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load tickets');
    }
  };

  const loadCFIs = async () => {
    try {
      const { data, error } = await supabase
        .from('cfis')
        .select('id, first_name, last_name, email')
        .eq('status', 'active');
      
      if (error) throw error;
      setCfis(data || []);
    } catch (error) {
      console.error('Error loading CFIs:', error);
    }
  };

  const assignCFI = async (ticketId: string, cfiId: string) => {
    setLoading(true);
    try {
      const { error: ticketError } = await supabase
        .from('lesson_tickets')
        .update({ cfi_id: cfiId, status: 'assigned' })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        const { error: requestError } = await supabase
          .from('lesson_requests')
          .update({ cfi_id: cfiId, status: 'assigned' })
          .eq('id', ticket.lesson_request.id);

        if (requestError) throw requestError;
      }

      Alert.alert('Success', 'CFI assigned successfully');
      loadTickets();
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error assigning CFI:', error);
      Alert.alert('Error', 'Failed to assign CFI');
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
            <Text style={styles.detailText}>Assigned CFI: {ticket.lesson_request.cfi.first_name} {ticket.lesson_request.cfi.last_name}</Text>
            
            {ticket.status === 'pending' && (
              <View style={styles.cfiAssignment}>
                <Text style={styles.assignTitle}>Reassign CFI:</Text>
                <ScrollView horizontal style={styles.cfiList}>
                  {cfis.map((cfi) => (
                    <TouchableOpacity
                      key={cfi.id}
                      style={styles.cfiButton}
                      onPress={() => assignCFI(ticket.id, cfi.id)}
                      disabled={loading}
                    >
                      <Text style={styles.cfiButtonText}>{cfi.first_name} {cfi.last_name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Ticket Dashboard</Text>
      
      <TouchableOpacity style={styles.refreshButton} onPress={loadTickets}>
        <Text style={styles.refreshButtonText}>Refresh Tickets</Text>
      </TouchableOpacity>

      <ScrollView style={styles.ticketsList}>
        {tickets.length === 0 ? (
          <Text style={styles.noTicketsText}>No tickets found</Text>
        ) : (
          tickets.map(renderTicket)
        )}
      </ScrollView>
    </View>
  );
}

export default function AdminTicketDashboard() {
  return (
    <AutoAuthProvider>
      <AdminTicketDashboardContent />
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
  cfiAssignment: { marginTop: 15 },
  assignTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  cfiList: { flexDirection: 'row' },
  cfiButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 6, marginRight: 10 },
  cfiButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  noTicketsText: { textAlign: 'center', fontSize: 16, color: '#666', marginTop: 50 }
});