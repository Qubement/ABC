import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Payments() {
  const { userRole } = useAuth();

  const getPaymentData = () => {
    switch (userRole) {
      case 'administrator':
        return {
          title: 'All Payments Overview',
          balance: '$15,250.00',
          pending: '$2,400.00',
          transactions: [
            { date: 'Dec 15', amount: '$150.00', type: 'Student Payment - Mike Johnson', status: 'completed' },
            { date: 'Dec 14', amount: '$200.00', type: 'Instructor Payment - Sarah Wilson', status: 'completed' },
            { date: 'Dec 13', amount: '$175.00', type: 'Student Payment - Emma Davis', status: 'pending' },
          ]
        };
      case 'instructor':
        return {
          title: 'Instructor Payments',
          balance: '$3,200.00',
          pending: '$450.00',
          transactions: [
            { date: 'Dec 15', amount: '$150.00', type: 'Flight Instruction Payment', status: 'completed' },
            { date: 'Dec 12', amount: '$100.00', type: 'Ground Instruction Payment', status: 'completed' },
          ]
        };
      case 'student':
        return {
          title: 'My Payments',
          balance: '-$850.00',
          pending: '$150.00',
          transactions: [
            { date: 'Dec 15', amount: '-$150.00', type: 'Flight Lesson Payment', status: 'completed' },
            { date: 'Dec 10', amount: '-$200.00', type: 'Aircraft Rental Payment', status: 'completed' },
          ]
        };
      default:
        return { title: 'Payments', balance: '$0.00', pending: '$0.00', transactions: [] };
    }
  };

  const getHeaderColor = () => {
    switch (userRole) {
      case 'administrator': 
        return '#007AFF';
      case 'instructor': 
        return '#4ECDC4';
      case 'student': 
        return '#45B7D1';
      default: 
        return '#007AFF';
    }
  };

  const data = getPaymentData();

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.subtitle}>{userRole?.charAt(0).toUpperCase() + userRole?.slice(1)} Account</Text>
      </View>

      <View style={styles.balanceSection}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[styles.balanceAmount, { color: data.balance.includes('-') ? '#FF3B30' : '#34C759' }]}>
            {data.balance}
          </Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Pending</Text>
          <Text style={styles.balanceAmount}>{data.pending}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {data.transactions.map((transaction, index) => (
          <View key={index} style={styles.transactionCard}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>{transaction.type}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <View style={styles.transactionAmount}>
              <Text style={[styles.amount, { color: transaction.amount.includes('-') ? '#FF3B30' : '#34C759' }]}>
                {transaction.amount}
              </Text>
              <Text style={[styles.status, { color: transaction.status === 'completed' ? '#34C759' : '#FF9800' }]}>
                {transaction.status.toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.paymentStatusCard}>
        <Text style={styles.sectionTitle}>Payment Status</Text>
        <Text style={styles.statusNote}>
          Payment status is managed manually by administrators. 
          Contact your flight school for payment processing.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 30, paddingTop: 50, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  balanceSection: { flexDirection: 'row', padding: 20, gap: 10 },
  balanceCard: { 
    flex: 1, 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  balanceLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  balanceAmount: { fontSize: 24, fontWeight: 'bold' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  transactionCard: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
    elevation: 2 
  },
  transactionInfo: { flex: 1 },
  transactionType: { fontSize: 16, fontWeight: '600', color: '#333' },
  transactionDate: { fontSize: 14, color: '#666', marginTop: 2 },
  transactionAmount: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  status: { fontSize: 12, fontWeight: '600' },
  paymentStatusCard: { 
    backgroundColor: 'white', 
    margin: 20, 
    padding: 20, 
    borderRadius: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  statusNote: { fontSize: 14, color: '#666', lineHeight: 20 }
});