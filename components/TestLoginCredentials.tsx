import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import { router } from 'expo-router';

interface TestUser {
  email: string;
  password: string;
  role: string;
  description: string;
}

const testUsers: TestUser[] = [
  { email: 'admin@test.com', password: 'password123', role: 'administrator', description: 'Test Admin User' },
  { email: 'gregsm77@live.com', password: '4427', role: 'administrator', description: 'Gregory McDonald (Admin)' },
  { email: 'instructor@test.com', password: 'password123', role: 'instructor', description: 'Test Instructor User' },
  { email: 'woods@fs.com', password: '1234', role: 'instructor', description: 'Bill Woods (CFI)' },
  { email: 'henry@fs.com', password: '1234', role: 'instructor', description: 'John Henry (CFI)' },
  { email: 'brandon@fs.com', password: '1234', role: 'instructor', description: 'Brandon Harvell (CFI)' },
  { email: 'student@test.com', password: 'password123', role: 'student', description: 'Test Student User' },
  { email: 'new@fs.com', password: '1234', role: 'student', description: 'New Bee (Student)' }
];

export default function TestLoginCredentials() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { login } = useAuth();

  const testLogin = async (user: TestUser) => {
    try {
      // First try Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (data.user && !error) {
        await login(user.role, user.email);
        await supabase.auth.signOut();
        return `✅ ${user.description} - Supabase Auth Success`;
      }

      // Try direct database lookup
      if (user.role === 'administrator') {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('email', user.email)
          .eq('password', user.password)
          .single();
        
        if (adminData) {
          return `✅ ${user.description} - Database Auth Success`;
        }
      } else if (user.role === 'instructor') {
        const { data: cfiData } = await supabase
          .from('cfis')
          .select('*')
          .eq('email', user.email)
          .eq('temp_password', user.password)
          .single();
        
        if (cfiData) {
          return `✅ ${user.description} - Database Auth Success`;
        }
      } else if (user.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email)
          .eq('password', user.password)
          .single();
        
        if (studentData) {
          return `✅ ${user.description} - Database Auth Success`;
        }
      }

      return `❌ ${user.description} - Login Failed`;
    } catch (error) {
      return `❌ ${user.description} - Error: ${error}`;
    }
  };

  const testAllUsers = async () => {
    setTesting(true);
    setResults([]);
    
    for (const user of testUsers) {
      const result = await testLogin(user);
      setResults(prev => [...prev, result]);
    }
    
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Login Credentials</Text>
      
      <TouchableOpacity 
        style={[styles.testButton, testing && styles.testButtonDisabled]} 
        onPress={testAllUsers}
        disabled={testing}
      >
        <Text style={styles.testButtonText}>
          {testing ? 'Testing...' : 'Test All Users'}
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  testButton: { backgroundColor: '#45B7D1', padding: 15, borderRadius: 8, marginBottom: 20 },
  testButtonDisabled: { backgroundColor: '#ccc' },
  testButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  resultsContainer: { flex: 1 },
  resultText: { fontSize: 14, marginBottom: 5, padding: 10, backgroundColor: 'white', borderRadius: 5 }
});