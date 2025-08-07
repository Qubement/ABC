import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';
import LessonTicketGenerator from './LessonTicketGenerator';
import { TicketService } from './TicketService';

interface LessonRequest {
  id: string;
  student_id: string;
  cfi_id: string;
  aircraft_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  status: string;
  student_message?: string;
  created_at: string;
}

interface LessonTicket {
  id: string;
  ticketNumber: string;
  studentName: string;
  cfiName: string;
  aircraftInfo: string;
  requestedDate: string;
  requestedTime: string;
  status: string;
  createdAt: string;
  studentMessage?: string;
}

interface Props {
  cfiId: string;
}

export default function CFILessonRequestsWithTickets({ cfiId }: Props) {
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [tickets, setTickets] = useState<LessonTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequestsAndGenerateTickets();
  }, [cfiId]);

  const fetchRequestsAndGenerateTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching requests for CFI:', cfiId);
      
      const { data, error } = await supabase
        .from('lesson_requests')
        .select('*')
        .eq('cfi_id', cfiId)
        .in('status', ['pending', 'approved', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
      
      console.log('Fetched requests:', data);
      setRequests(data || []);
      
      // Generate tickets from requests
      const generatedTickets = await TicketService.generateTicketsFromRequests(data || []);
      setTickets(generatedTickets);
      
    } catch (error) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load lesson requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({ 
          status: 'approved',
          cfi_message: 'Request approved by CFI',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      Alert.alert('Success', 'Lesson request approved!');
      fetchRequestsAndGenerateTickets();
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_requests')
        .update({ 
          status: 'rejected',
          cfi_message: 'Request rejected by CFI',
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      Alert.alert('Success', 'Lesson request rejected');
      fetchRequestsAndGenerateTickets();
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Loading lesson requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Lesson Request Tickets</Text>
      
      {tickets.map(ticket => (
        <View key={ticket.id}>
          <LessonTicketGenerator ticket={ticket} />
          
          {ticket.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#28a745', padding: 12, borderRadius: 5, flex: 1 }}
                onPress={() => handleApprove(ticket.id)}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ backgroundColor: '#dc3545', padding: 12, borderRadius: 5, flex: 1 }}
                onPress={() => handleReject(ticket.id)}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      
      {tickets.length === 0 && (
        <View style={{ backgroundColor: 'white', padding: 30, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ textAlign: 'center', color: '#666', fontSize: 16 }}>No lesson request tickets</Text>
          <Text style={{ textAlign: 'center', color: '#999', fontSize: 14, marginTop: 5 }}>Tickets will appear here when students submit requests</Text>
        </View>
      )}
    </ScrollView>
  );
}