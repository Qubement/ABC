import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';

interface RolePermissionValidatorProps {
  children: React.ReactNode;
}

export default function RolePermissionValidator({ children }: RolePermissionValidatorProps) {
  const { userRole, userId } = useAuth();
  const [isValidated, setIsValidated] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    validateUserPermissions();
  }, [userRole, userId]);

  const validateUserPermissions = async () => {
    try {
      if (!userRole || !userId) {
        setPermissionError('User authentication required');
        return;
      }

      // Check if user exists in appropriate table
      let userExists = false;
      
      switch (userRole) {
        case 'administrator':
          const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('id', userId)
            .single();
          userExists = !!adminData;
          break;
          
        case 'instructor':
          const { data: cfiData } = await supabase
            .from('cfis')
            .select('id')
            .eq('id', userId)
            .single();
          userExists = !!cfiData;
          break;
          
        case 'student':
          const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('id', userId)
            .single();
          userExists = !!studentData;
          break;
          
        default:
          setPermissionError('Invalid user role');
          return;
      }

      if (!userExists) {
        setPermissionError(`User not found in ${userRole} table`);
        return;
      }

      setIsValidated(true);
      setPermissionError(null);
    } catch (error) {
      console.error('Permission validation error:', error);
      setPermissionError('Failed to validate permissions');
    }
  };

  const getPermissionDescription = () => {
    switch (userRole) {
      case 'administrator':
        return 'Full system access - can create, edit, approve, and delete all schedules';
      case 'instructor':
        return 'CFI access - can manage schedules for assigned students';
      case 'student':
        return 'Student access - can view own schedules and request lessons';
      default:
        return 'Unknown role permissions';
    }
  };

  if (permissionError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Permission Error</Text>
        <Text style={styles.errorText}>{permissionError}</Text>
        <Text style={styles.errorSubtext}>Please contact your administrator</Text>
      </View>
    );
  }

  if (!isValidated) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Validating permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.permissionBanner}>
        <Text style={styles.roleText}>Role: {userRole?.toUpperCase()}</Text>
        <Text style={styles.permissionText}>{getPermissionDescription()}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffebee' },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#c62828', marginBottom: 10 },
  errorText: { fontSize: 16, color: '#d32f2f', textAlign: 'center', marginBottom: 10 },
  errorSubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  permissionBanner: { backgroundColor: '#e3f2fd', padding: 8, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#bbdefb' },
  roleText: { fontSize: 12, fontWeight: 'bold', color: '#1976d2' },
  permissionText: { fontSize: 10, color: '#1565c0', textAlign: 'center', marginTop: 2 }
});