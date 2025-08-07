import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface AuthAccount {
  id: string;
  email: string;
  type: 'student' | 'cfi' | 'admin';
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function EditAuthAccountsModal({ visible, onClose }: Props) {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAuthAccounts = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('id, email')
        .order('email');
      
      // Fetch CFIs
      const { data: cfis } = await supabase
        .from('cfis')
        .select('id, email')
        .order('email');
      
      // Fetch admins
      const { data: admins } = await supabase
        .from('admins')
        .select('id, email')
        .order('email');
      
      const allAccounts: AuthAccount[] = [
        ...(students || []).map(s => ({ ...s, type: 'student' as const })),
        ...(cfis || []).map(c => ({ ...c, type: 'cfi' as const })),
        ...(admins || []).map(a => ({ ...a, type: 'admin' as const }))
      ];
      
      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      Alert.alert('Error', 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (account: AuthAccount) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete ${account.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(account.id);
            try {
              const table = account.type === 'student' ? 'students' : 
                          account.type === 'cfi' ? 'cfis' : 'admins';
              const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', account.id);
              
              if (error) throw error;
              
              setAccounts(prev => prev.filter(a => a.id !== account.id));
              Alert.alert('Success', 'Account deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete account');
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      fetchAuthAccounts();
    }
  }, [visible]);

  const studentAccounts = accounts.filter(a => a.type === 'student');
  const cfiAccounts = accounts.filter(a => a.type === 'cfi');
  const adminAccounts = accounts.filter(a => a.type === 'admin');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Edit Auth Accounts</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#007AFF', fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <ScrollView>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: 'green' }}>
              Students ({studentAccounts.length})
            </Text>
            {studentAccounts.map(account => (
              <View key={account.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', marginBottom: 5, borderRadius: 5 }}>
                <Text style={{ color: 'green', flex: 1 }}>{account.email}</Text>
                <TouchableOpacity
                  onPress={() => deleteAccount(account)}
                  disabled={deleting === account.id}
                  style={{ backgroundColor: '#FF3B30', padding: 8, borderRadius: 5, opacity: deleting === account.id ? 0.5 : 1 }}
                >
                  {deleting === account.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
            
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#FF9500' }}>
              CFIs ({cfiAccounts.length})
            </Text>
            {cfiAccounts.map(account => (
              <View key={account.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', marginBottom: 5, borderRadius: 5 }}>
                <Text style={{ color: '#FF9500', flex: 1 }}>{account.email}</Text>
                <TouchableOpacity
                  onPress={() => deleteAccount(account)}
                  disabled={deleting === account.id}
                  style={{ backgroundColor: '#FF3B30', padding: 8, borderRadius: 5, opacity: deleting === account.id ? 0.5 : 1 }}
                >
                  {deleting === account.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
            
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: 'red' }}>
              Admins ({adminAccounts.length})
            </Text>
            {adminAccounts.map(account => (
              <View key={account.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', marginBottom: 5, borderRadius: 5 }}>
                <Text style={{ color: 'red', flex: 1 }}>{account.email}</Text>
                <TouchableOpacity
                  onPress={() => deleteAccount(account)}
                  disabled={deleting === account.id}
                  style={{ backgroundColor: '#FF3B30', padding: 8, borderRadius: 5, opacity: deleting === account.id ? 0.5 : 1 }}
                >
                  {deleting === account.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontSize: 12 }}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}