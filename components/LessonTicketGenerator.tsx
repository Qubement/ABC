import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  ticket: LessonTicket;
}

export default function LessonTicketGenerator({ ticket }: Props) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <View style={styles.ticket}>
      <View style={styles.header}>
        <Text style={styles.ticketNumber}>Ticket #{ticket.ticketNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
          <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Student:</Text>
          <Text style={styles.value}>{ticket.studentName}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>CFI:</Text>
          <Text style={styles.value}>{ticket.cfiName}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Aircraft:</Text>
          <Text style={styles.value}>{ticket.aircraftInfo}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{ticket.requestedDate}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{ticket.requestedTime}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
        </View>
        
        {ticket.studentMessage && (
          <View style={styles.messageContainer}>
            <Text style={styles.label}>Message:</Text>
            <Text style={styles.message}>{ticket.studentMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#45B7D1'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 12
  },
  content: {
    gap: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right'
  },
  messageContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4
  },
  message: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginTop: 4
  }
});