import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import { router } from 'expo-router';

interface CompleteProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profileData: any;
  userEmail: string;
  accountCategory?: string;
  onComplete?: () => void;
}

export default function CompleteProfileModal({ visible, onClose, profileData, userEmail, accountCategory, onComplete }: CompleteProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const { userRole, setUserRole, setProfileCompleted } = useAuth();

  const handleCancel = () => {
    onClose();
    router.push('/');
  };

  const determineUserRole = async (email: string) => {
    try {
      // Check students table
      const { data: studentData } = await supabase
        .from('students')
        .select('role')
        .eq('email', email)
        .single();
      
      if (studentData?.role) return studentData.role;

      // Check cfis table
      const { data: cfiData } = await supabase
        .from('cfis')
        .select('role')
        .eq('email', email)
        .single();
      
      if (cfiData?.role) return cfiData.role;

      // Check admins table
      const { data: adminData } = await supabase
        .from('admins')
        .select('role')
        .eq('email', email)
        .single();
      
      if (adminData?.role) return adminData.role;

      return null;
    } catch (error) {
      console.error('Error determining role:', error);
      return null;
    }
  };

  const handleGotoCFIDashboard = async () => {
    setLoading(true);
    try {
      // Update CFI profile with all fields including hourly_rate
      const updateData: any = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
        ftn_number: profileData.ftnNumber,
        hourly_rate: profileData.hourlyRate,
        ratings: profileData.ratings,
        drivers_license_url: profileData.driversLicenseUrl,
        pilot_certificate_url: profileData.pilotCertificateUrl,
        medical_certificate_url: profileData.medicalCertificateUrl,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cfis')
        .update(updateData)
        .eq('email', userEmail);

      if (error) throw error;

      setUserRole('instructor');
      setProfileCompleted(true);
      onClose();
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      } else {
        // Navigate to CFI dashboard
        router.push('/cfi-dashboard');
      }
      
    } catch (error) {
      console.error('Error updating CFI profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGotoDashboard = async () => {
    setLoading(true);
    try {
      // Determine role from database
      let roleToUse = await determineUserRole(userEmail);
      
      if (!roleToUse) {
        Alert.alert('Error', 'Unable to determine user role from database. Please contact support.');
        return;
      }

      // Update the auth context with the determined role
      setUserRole(roleToUse);

      let tableName = '';
      let updateData: any = {
        first_name: profileData.firstName || profileData.name?.split(' ')[0] || '',
        last_name: profileData.lastName || profileData.name?.split(' ')[1] || '',
        phone: profileData.phone,
        profile_completed: true,
        updated_at: new Date().toISOString()
      };

      // Determine table based on role
      if (roleToUse === 'student') {
        tableName = 'students';
        if (profileData.studentId) updateData.student_id = profileData.studentId;
        if (profileData.licenseType) updateData.license_type = profileData.licenseType;
        if (profileData.hoursLogged) updateData.hours_logged = parseInt(profileData.hoursLogged) || 0;
      } else if (roleToUse === 'cfi' || roleToUse === 'instructor') {
        tableName = 'cfis';
        if (profileData.certification) updateData.certification = profileData.certification;
        if (profileData.aircraftTypes) updateData.aircraft_types = profileData.aircraftTypes;
        if (profileData.licenseNumber) updateData.license_number = profileData.licenseNumber;
      } else if (Array.isArray(roleToUse) || roleToUse.includes('admin')) {
        tableName = 'admins';
        if (profileData.adminLevel) updateData.admin_level = profileData.adminLevel;
        if (profileData.department) updateData.department = profileData.department;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('email', userEmail);

      if (error) throw error;

      setProfileCompleted(true);
      onClose();
      
      if (onComplete) {
        onComplete();
      } else {
        router.push('/(tabs)');
      }
      
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if this is a CFI profile completion
  const isCFIProfile = profileData.ratings || profileData.ftnNumber;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1, width: '100%' }}
          >
            <View style={{ 
              backgroundColor: 'white', 
              padding: 20, 
              borderRadius: 12, 
              width: '80%',
              marginTop: 60,
              marginBottom: 60
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>
                Update Profile
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
                Ready to update your profile? This will save your changes and return you to your dashboard.
              </Text>
              
              <TouchableOpacity
                style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginBottom: 10 }}
                onPress={isCFIProfile ? handleGotoCFIDashboard : handleGotoDashboard}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
                    {isCFIProfile ? 'Update CFI Profile' : 'Update Profile'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ backgroundColor: '#ccc', padding: 12, borderRadius: 8 }}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}