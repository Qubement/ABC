import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StudentLessonRequestSystem from '../components/StudentLessonRequestSystem';
import AdminTicketDashboard from '../components/AdminTicketDashboard';
import CFITicketReceiver from '../components/CFITicketReceiver';
import LessonRequestTestSystem from '../components/LessonRequestTestSystem';

type TabType = 'student' | 'admin' | 'cfi' | 'test';

export default function LessonSystemTest() {
  const [activeTab, setActiveTab] = useState<TabType>('student');

  const renderContent = () => {
    switch (activeTab) {
      case 'student':
        return <StudentLessonRequestSystem />;
      case 'admin':
        return <AdminTicketDashboard />;
      case 'cfi':
        return <CFITicketReceiver />;
      case 'test':
        return <LessonRequestTestSystem />;
      default:
        return <StudentLessonRequestSystem />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'student' && styles.activeTab]}
          onPress={() => setActiveTab('student')}
        >
          <Text style={[styles.tabText, activeTab === 'student' && styles.activeTabText]}>Student</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'admin' && styles.activeTab]}
          onPress={() => setActiveTab('admin')}
        >
          <Text style={[styles.tabText, activeTab === 'admin' && styles.activeTabText]}>Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'cfi' && styles.activeTab]}
          onPress={() => setActiveTab('cfi')}
        >
          <Text style={[styles.tabText, activeTab === 'cfi' && styles.activeTabText]}>CFI</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'test' && styles.activeTab]}
          onPress={() => setActiveTab('test')}
        >
          <Text style={[styles.tabText, activeTab === 'test' && styles.activeTabText]}>Test</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: '#45B7D1'
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666'
  },
  activeTabText: {
    color: '#45B7D1',
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  }
});