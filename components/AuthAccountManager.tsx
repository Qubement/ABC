import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import EditAuthAccountsModal from './EditAuthAccountsModal';

interface AuthResult {
  email: string;
  status: 'success' | 'error';
  type?: 'student' | 'cfi';
  error?: string;
}

export default function AuthAccountManager() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuthResult[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);

  const createAuthAccounts = async (type: 'all') => {
    setLoading(true);
    setResults([]);
    
    try {
      const response = await fetch(
        'https://vofhgdchvvzrbqfnxvst.supabase.co/functions/v1/a42f73d5-a474-4d01-82e9-24926e937f0e',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type })
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }
      
      setResults(data.results || []);
      
      const successCount = data.results?.filter((r: AuthResult) => r.status === 'success').length || 0;
      const errorCount = data.results?.filter((r: AuthResult) => r.status === 'error').length || 0;
      
      Alert.alert(
        'Account Creation Complete',
        `Successfully created ${successCount} accounts. ${errorCount} errors.`
      );
      
    } catch (error) {
      console.error('Auth account creation error:', error);
      Alert.alert('Error', 'Failed to create auth accounts. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Auth Account Manager
      </Text>
      
      <View style={{ gap: 10, marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#FF9500',
            padding: 15,
            borderRadius: 8,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1
          }}
          onPress={() => createAuthAccounts('all')}
          disabled={loading}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Create All Auth Accounts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 8,
            alignItems: 'center'
          }}
          onPress={() => setShowEditModal(true)}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Edit ALL Auth Accounts
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 10 }}>Creating auth accounts...</Text>
        </View>
      )}
      
      {results.length > 0 && (
        <ScrollView style={{ maxHeight: 300 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Results:
          </Text>
          {results.map((result, index) => (
            <View
              key={index}
              style={{
                padding: 10,
                marginBottom: 5,
                backgroundColor: result.status === 'success' ? '#E8F5E8' : '#FFE8E8',
                borderRadius: 5
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>{result.email}</Text>
              <Text style={{ color: result.status === 'success' ? 'green' : 'red' }}>
                {result.status === 'success' ? 'Success' : `Error: ${result.error}`}
              </Text>
              {result.type && (
                <Text style={{ fontSize: 12, color: '#666' }}>
                  Type: {result.type}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
      
      <EditAuthAccountsModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </View>
  );
}