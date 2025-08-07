import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { supabase } from '../app/lib/supabase';

interface AddAdminModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddAdminModal({ visible, onClose }: AddAdminModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    superAdmin: false,
    userAccManager: false,
    scheduleManager: false,
    financialAccManager: false,
    cfi: false
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      superAdmin: false,
      userAccManager: false,
      scheduleManager: false,
      financialAccManager: false,
      cfi: false
    });
  };

  const handleCheckboxToggle = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingAdmin) {
        Alert.alert('Error', 'An administrator with this email already exists');
        setLoading(false);
        return;
      }

      const roles = [];
      if (formData.superAdmin) roles.push('super_admin');
      if (formData.userAccManager) roles.push('user_acc_manager');
      if (formData.scheduleManager) roles.push('schedule_manager');
      if (formData.financialAccManager) roles.push('financial_acc_manager');
      if (formData.cfi) roles.push('cfi');
      
      if (roles.length === 0) roles.push('admin');

      const { error: dbError } = await supabase
        .from('admins')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password || '1234',
          super_admin: formData.superAdmin,
          user_acc_manager: formData.userAccManager,
          schedule_manager: formData.scheduleManager,
          financial_acc_manager: formData.financialAccManager,
          is_cfi: formData.cfi,
          role: roles
        });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Administrator added successfully');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding admin:', error);
      Alert.alert('Error', 'Failed to add administrator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Add Administrator</Text>
          <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
            <Text style={{ fontSize: 18, color: '#666' }}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={{ marginBottom: 15 }}>
            <Text style={{ marginBottom: 5, fontWeight: '500' }}>First Name *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, backgroundColor: '#fff' }}
              value={formData.firstName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
              placeholder="Enter first name"
            />
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ marginBottom: 5, fontWeight: '500' }}>Last Name *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, backgroundColor: '#fff' }}
              value={formData.lastName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
              placeholder="Enter last name"
            />
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ marginBottom: 5, fontWeight: '500' }}>Email Address *</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, backgroundColor: '#fff' }}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Admin Roles</Text>
          
          {[
            { key: 'superAdmin', label: 'Super Admin' },
            { key: 'userAccManager', label: 'User Acc. Manager' },
            { key: 'scheduleManager', label: 'Schedule Manager' },
            { key: 'financialAccManager', label: 'Financial Acc. Manager' },
            { key: 'cfi', label: 'CFI' }
          ].map(role => (
            <TouchableOpacity
              key={role.key}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 10, backgroundColor: '#fff', borderRadius: 5 }}
              onPress={() => handleCheckboxToggle(role.key)}
            >
              <View style={{ width: 20, height: 20, borderWidth: 2, borderColor: '#007AFF', marginRight: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: formData[role.key] ? '#007AFF' : '#fff' }}>
                {formData[role.key] && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 16 }}>{role.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#ddd' }}>
          <TouchableOpacity
            style={{ backgroundColor: loading ? '#ccc' : '#007AFF', padding: 15, borderRadius: 5, alignItems: 'center' }}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              {loading ? 'Adding...' : 'Add Administrator'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}