import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from './context/AuthContext';

export default function HomePage() {
  const { login } = useAuth();

  const handleEnterApp = async () => {
    // Auto-login as administrator
    await login('administrator', 'admin@example.com');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛩️ Flight School App</Text>
        <Text style={styles.headerSubtitle}>No Authentication Required</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Welcome</Text>
          <Text style={styles.description}>Authentication has been removed. Click below to enter the app.</Text>
          
          <TouchableOpacity style={styles.enterButton} onPress={handleEnterApp}>
            <Text style={styles.enterButtonText}>Enter App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={() => router.push('/lesson-system-test')}>
            <Text style={styles.testButtonText}>Go to Lesson System Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#45B7D1', padding: 20, paddingTop: 60 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: 'white', fontSize: 14, opacity: 0.9, marginTop: 5 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  loginCard: { backgroundColor: 'white', padding: 30, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  loginTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666', lineHeight: 22 },
  enterButton: { backgroundColor: '#45B7D1', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  enterButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  testButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center' },
  testButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' }
});