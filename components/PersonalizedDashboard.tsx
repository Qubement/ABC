import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';
import AdminDashboard from './AdminDashboard';
import RoleBasedAdminDashboard from './RoleBasedAdminDashboard';
import SettingsDropdown from './SettingsDropdown';
import LogoutButton from './LogoutButton';

interface UserData {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  profile_completed?: boolean;
  super_admin?: boolean;
  user_acc_manager?: boolean;
  schedule_manager?: boolean;
  financial_acc_manager?: boolean;
}

export default function PersonalizedDashboard() {
  const { userRole, userEmail, logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userEmail, userRole]);

  const fetchUserData = async () => {
    if (!userEmail || !userRole) return;

    try {
      let tableName = '';
      switch (userRole) {
        case 'student':
          tableName = 'students';
          break;
        case 'instructor':
          tableName = 'cfis';
          break;
        case 'administrator':
          tableName = 'admins';
          break;
        default:
          return;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
      } else {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'administrator': return 'settings';
      case 'instructor': return 'airplane';
      case 'student': return 'school';
      default: return 'person';
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'administrator': return '#FF6B35';
      case 'instructor': return '#007AFF';
      case 'student': return '#34C759';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (userRole === 'administrator' && userData) {
    const isDemoAdmin = !userData.super_admin && !userData.user_acc_manager && 
                       !userData.schedule_manager && !userData.financial_acc_manager;
    
    if (isDemoAdmin) {
      return <AdminDashboard userRole={userRole} />;
    } else {
      return <RoleBasedAdminDashboard adminData={userData} />;
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={[styles.roleIcon, { backgroundColor: getRoleColor() }]}>
            <Ionicons name={getRoleIcon() as any} size={30} color="white" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>
              {userData?.first_name && userData?.last_name 
                ? `${userData.first_name} ${userData.last_name}`
                : userEmail}
            </Text>
            <Text style={styles.userRole}>{userRole?.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
          <LogoutButton variant="text" />
        </View>
      </View>

      <View style={styles.dashboardContent}>
        <Text style={styles.sectionTitle}>Your Personal Dashboard</Text>
        <Text style={styles.sectionSubtitle}>
          This dashboard is personalized for your account and role.
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={getRoleColor()} />
            <Text style={styles.statTitle}>Profile Complete</Text>
            <Text style={styles.statValue}>✓</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="mail" size={24} color={getRoleColor()} />
            <Text style={styles.statTitle}>Email</Text>
            <Text style={styles.statValue}>{userEmail}</Text>
          </View>
        </View>

        {userData?.phone && (
          <View style={styles.infoCard}>
            <Ionicons name="call" size={20} color={getRoleColor()} />
            <Text style={styles.infoText}>Phone: {userData.phone}</Text>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={[styles.actionButton, { borderColor: getRoleColor() }]}>
            <Ionicons name="person-circle" size={24} color={getRoleColor()} />
            <Text style={[styles.actionText, { color: getRoleColor() }]}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SettingsDropdown
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { fontSize: 16, color: '#666' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  roleIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userDetails: { flex: 1 },
  welcomeText: { fontSize: 14, color: '#666' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 2 },
  userRole: { fontSize: 12, color: '#666', marginTop: 2 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingsButton: { padding: 10 },
  dashboardContent: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  statTitle: { fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 4, textAlign: 'center' },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  infoText: { fontSize: 14, color: '#333', marginLeft: 10 },
  quickActions: { marginTop: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 2, marginTop: 10 },
  actionText: { fontSize: 16, fontWeight: '600', marginLeft: 10 }
});