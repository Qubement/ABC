import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LessonRequestFixedForm from '../components/LessonRequestFixedForm';
import LessonRequestTestRunnerFixed from '../components/LessonRequestTestRunnerFixed';
import CFILessonRequestsFixed from '../components/CFILessonRequestsFixed';

export default function TestLessonRequestFixedPage() {
  const [activeTab, setActiveTab] = useState('form');
  const [testCFIId, setTestCFIId] = useState('test-cfi-id');

  const tabs = [
    { id: 'form', label: 'Submit Request', icon: '📝' },
    { id: 'test', label: 'Run Tests', icon: '🧪' },
    { id: 'cfi', label: 'CFI View', icon: '👨‍✈️' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'form':
        return <LessonRequestFixedForm />;
      case 'test':
        return <LessonRequestTestRunnerFixed />;
      case 'cfi':
        return <CFILessonRequestsFixed cfiId={testCFIId} />;
      default:
        return <LessonRequestFixedForm />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Fixed Lesson Request System</Text>
      </View>
      
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  activeTab: {
    borderBottomColor: '#45B7D1'
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 5
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  activeTabText: {
    color: '#45B7D1',
    fontWeight: 'bold'
  },
  content: {
    flex: 1
  }
});