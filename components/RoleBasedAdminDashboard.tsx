import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';
import { router } from 'expo-router';
import AddCFIModal from './AddCFIModal';
import AddStudentModal from './AddStudentModal';
import StudentScheduleModal from './StudentScheduleModal';
import CFIScheduleModal from './CFIScheduleModal';
import StudentFinancialSpreadsheet from './StudentFinancialSpreadsheet';
import CompleteFlightModal from './CompleteFlightModal';
import AdminBackdoor from './AdminBackdoor';
import InactiveStudentsModal from './InactiveStudentsModal';
import SettingsDropdown from './SettingsDropdown';

interface RoleBasedAdminDashboardProps {
  adminData: any;
}

export default function RoleBasedAdminDashboard({ adminData }: RoleBasedAdminDashboardProps) {
  const { logout } = useAuth();
  const [showAddCFI, setShowAddCFI] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showStudentSchedule, setShowStudentSchedule] = useState(false);
  const [showCFISchedule, setShowCFISchedule] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showCompleteFlightModal, setShowCompleteFlightModal] = useState(false);
  const [showBackdoorModal, setShowBackdoorModal] = useState(false);
  const [showInactiveStudents, setShowInactiveStudents] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [cfiCount, setCfiCount] = useState(0);
  const [aircraftCount, setAircraftCount] = useState(0);

  const isSuperAdmin = adminData?.super_admin;
  const isUserAccManager = adminData?.user_acc_manager;
  const isScheduleManager = adminData?.schedule_manager;
  const isFinancialManager = adminData?.financial_acc_manager;

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [studentsRes, cfisRes, aircraftRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('cfis').select('id', { count: 'exact' }),
        supabase.from('aircraft').select('id', { count: 'exact' })
      ]);
      
      setStudentCount(studentsRes.count || 0);
      setCfiCount(cfisRes.count || 0);
      setAircraftCount(aircraftRes.count || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getDashboardTitle = () => {
    if (isSuperAdmin) return 'Super Administrator Dashboard';
    if (isUserAccManager) return 'User Account Manager Dashboard';
    if (isScheduleManager) return 'Schedule Manager Dashboard';
    if (isFinancialManager) return 'Financial Manager Dashboard';
    return 'Administrator Dashboard';
  };

  const getWelcomeMessage = () => {
    const name = `${adminData?.first_name || ''} ${adminData?.last_name || ''}`.trim();
    return `Welcome, ${name || 'Administrator'}`;
  };

  if (showFinancials) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowFinancials(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Financial Overview</Text>
        </View>
        <StudentFinancialSpreadsheet studentId={null} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{getDashboardTitle()}</Text>
          <Text style={styles.subtitle}>{getWelcomeMessage()}</Text>
        </View>
        {isSuperAdmin && (
          <TouchableOpacity onPress={() => setShowSettings(true)}>
            <Ionicons name="settings" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{studentCount}</Text>
          <Text style={styles.statLabel}>Active Students</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{cfiCount}</Text>
          <Text style={styles.statLabel}>Instructors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{aircraftCount}</Text>
          <Text style={styles.statLabel}>Aircraft</Text>
        </View>
      </View>

      {isSuperAdmin && (
        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.completeButton} onPress={() => setShowCompleteFlightModal(true)}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.completeButtonText}>Complete Flight</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Available Actions</Text>
        
        {(isSuperAdmin || isUserAccManager) && (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowAddCFI(true)}>
              <View style={styles.menuLeft}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
                <Text style={styles.menuTitle}>Add CFI</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowAddStudent(true)}>
              <View style={styles.menuLeft}>
                <Ionicons name="person-add" size={24} color="#007AFF" />
                <Text style={styles.menuTitle}>Add Student</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </>
        )}
        
        {(isSuperAdmin || isScheduleManager) && (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowStudentSchedule(true)}>
              <View style={styles.menuLeft}>
                <Ionicons name="calendar" size={24} color="#007AFF" />
                <Text style={styles.menuTitle}>Student Schedule</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowCFISchedule(true)}>
              <View style={styles.menuLeft}>
                <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                <Text style={styles.menuTitle}>CFI Schedule</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </>
        )}
        
        {isSuperAdmin && (
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowFinancials(true)}>
            <View style={styles.menuLeft}>
              <Ionicons name="analytics" size={24} color="#007AFF" />
              <Text style={styles.menuTitle}>View Financials</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {isSuperAdmin && (
        <>
          <TouchableOpacity style={styles.backdoorButton} onPress={() => setShowBackdoorModal(true)}>
            <Text style={styles.backdoorText}>🔓 Admin Backdoor</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.inactiveButton} onPress={() => setShowInactiveStudents(true)}>
            <Text style={styles.inactiveText}>Inactive Students</Text>
          </TouchableOpacity>
        </>
      )}

      <AddCFIModal visible={showAddCFI} onClose={() => setShowAddCFI(false)} />
      <AddStudentModal visible={showAddStudent} onClose={() => setShowAddStudent(false)} />
      <StudentScheduleModal visible={showStudentSchedule} onClose={() => setShowStudentSchedule(false)} />
      <CFIScheduleModal visible={showCFISchedule} onClose={() => setShowCFISchedule(false)} />
      <CompleteFlightModal visible={showCompleteFlightModal} onClose={() => setShowCompleteFlightModal(false)} onComplete={() => setShowCompleteFlightModal(false)} />
      <AdminBackdoor visible={showBackdoorModal} onClose={() => setShowBackdoorModal(false)} />
      <InactiveStudentsModal visible={showInactiveStudents} onClose={() => setShowInactiveStudents(false)} />
      <SettingsDropdown visible={showSettings} onClose={() => setShowSettings(false)} onLogout={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#007AFF', padding: 30, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerContent: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  statsRow: { flexDirection: 'row', padding: 20, gap: 15 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5, textAlign: 'center' },
  buttonSection: { padding: 20, paddingTop: 0 },
  completeButton: { backgroundColor: '#9C27B0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  completeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  menuSection: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  menuItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 12 },
  backdoorButton: { backgroundColor: '#FF6B6B', margin: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
  backdoorText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  inactiveButton: { backgroundColor: '#6c757d', margin: 20, marginTop: 0, padding: 15, borderRadius: 12, alignItems: 'center' },
  inactiveText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});