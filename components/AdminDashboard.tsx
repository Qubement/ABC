import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddCFIModal from './AddCFIModal';
import AddAircraftModal from './AddAircraftModal';
import AddStudentModal from './AddStudentModal';
import AddAdminModal from './AddAdminModal';
import FixedScheduleManager from './FixedScheduleManager';
import ScheduleTypeSelector from './ScheduleTypeSelector';
import CompleteFlightModal from './CompleteFlightModal';
import StudentFinancialSpreadsheet from './StudentFinancialSpreadsheet';
import AdminBackdoor from './AdminBackdoor';
import AuthAccountManager from './AuthAccountManager';
import AdminLessonRequestViewer from './AdminLessonRequestViewer';
import { supabase } from '../app/lib/supabase';
import { useAuth } from '../app/context/AuthContext';

interface AdminDashboardProps {
  userRole: string;
}

export default function AdminDashboard({ userRole = 'administrator' }: AdminDashboardProps = {}) {
  const { userId } = useAuth();
  const [showAddCFIModal, setShowAddCFIModal] = useState(false);
  const [showAddAircraftModal, setShowAddAircraftModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showScheduleTypeSelector, setShowScheduleTypeSelector] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [showCompleteFlightModal, setShowCompleteFlightModal] = useState(false);
  const [showBackdoorModal, setShowBackdoorModal] = useState(false);
  const [showAuthManager, setShowAuthManager] = useState(false);
  const [showLessonRequestViewer, setShowLessonRequestViewer] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scheduleEntity, setScheduleEntity] = useState<{type: 'aircraft' | 'cfi' | 'student', id: string, name: string} | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [cfiCount, setCfiCount] = useState(0);
  const [aircraftCount, setAircraftCount] = useState(0);
  const [lessonRequestCount, setLessonRequestCount] = useState(0);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [studentsRes, cfisRes, aircraftRes, lessonRequestsRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('cfis').select('*'),
        supabase.from('aircraft').select('*'),
        supabase.from('lesson_requests').select('*')
      ]);
      
      setStudentCount(studentsRes.data?.length || 0);
      setCfiCount(cfisRes.data?.length || 0);
      setAircraftCount(aircraftRes.data?.length || 0);
      setLessonRequestCount(lessonRequestsRes.data?.length || 0);
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*');
    setStudents(data || []);
  };

  const handleBackdoorPress = () => {
    setShowBackdoorModal(true);
  };

  const menuItems = [
    { id: 'add-student', title: 'Add Student', icon: 'person-add', count: null },
    { id: 'add-cfi', title: 'Add CFI', icon: 'add-circle', count: null },
    { id: 'add-aircraft', title: 'Add Aircraft', icon: 'airplane-outline', count: null },
    { id: 'manage-schedules', title: 'Manage Schedules', icon: 'calendar', count: null },
    { id: 'view-lesson-requests', title: 'View Lesson Requests', icon: 'document-text', count: lessonRequestCount },
    { id: 'auth-accounts', title: 'Manage Auth Accounts', icon: 'key', count: null },
  ];

  const handleMenuPress = (itemId: string) => {
    if (itemId === 'add-cfi') {
      setShowAddCFIModal(true);
    } else if (itemId === 'add-aircraft') {
      setShowAddAircraftModal(true);
    } else if (itemId === 'add-student') {
      setShowAddStudentModal(true);
    } else if (itemId === 'manage-schedules') {
      setShowScheduleTypeSelector(true);
    } else if (itemId === 'view-lesson-requests') {
      setShowLessonRequestViewer(true);
    } else if (itemId === 'auth-accounts') {
      setShowAuthManager(true);
    }
  };

  const handleEntitySelect = (entity: { type: 'student' | 'cfi' | 'aircraft', id: string, name: string }) => {
    setScheduleEntity(entity);
    setShowScheduleTypeSelector(false);
    setShowScheduleManager(true);
  };

  if (selectedStudent) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedStudent(null)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Student Spreadsheet</Text>
        </View>
        <StudentFinancialSpreadsheet studentId={selectedStudent.id} />
      </View>
    );
  }

  if (showScheduleManager && scheduleEntity) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowScheduleManager(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Schedule Manager</Text>
        </View>
        <FixedScheduleManager
          entityType={scheduleEntity.type}
          entityId={scheduleEntity.id}
          entityName={scheduleEntity.name}
        />
      </View>
    );
  }

  if (showAuthManager) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowAuthManager(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Auth Account Manager</Text>
        </View>
        <AuthAccountManager />
      </View>
    );
  }

  if (showLessonRequestViewer) {
    return (
      <AdminLessonRequestViewer onClose={() => setShowLessonRequestViewer(false)} />
    );
  }

  if (showScheduleTypeSelector) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowScheduleTypeSelector(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Schedule Management</Text>
        </View>
        <ScheduleTypeSelector onEntitySelect={handleEntitySelect} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Administrator Dashboard</Text>
        <Text style={styles.subtitle}>Manage all flight school operations</Text>
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
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{lessonRequestCount}</Text>
          <Text style={styles.statLabel}>Lesson Requests</Text>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.completeButton} onPress={() => setShowCompleteFlightModal(true)}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.completeButtonText}>Complete Flight</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuItem}
            onPress={() => handleMenuPress(item.id)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon as any} size={24} color="#007AFF" />
              <Text style={styles.menuTitle}>{item.title}</Text>
              {item.count !== null && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{item.count}</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.backdoorButton} onPress={handleBackdoorPress}>
        <Text style={styles.backdoorText}>🔓 Admin Backdoor</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addAdminButton} onPress={() => setShowAddAdminModal(true)}>
        <Text style={styles.addAdminText}>👤 Add Administrator</Text>
      </TouchableOpacity>

      <AdminBackdoor visible={showBackdoorModal} onClose={() => setShowBackdoorModal(false)} />
      <AddStudentModal visible={showAddStudentModal} onClose={() => { setShowAddStudentModal(false); fetchCounts(); }} />
      <AddCFIModal visible={showAddCFIModal} onClose={() => { setShowAddCFIModal(false); fetchCounts(); }} />
      <AddAircraftModal visible={showAddAircraftModal} onClose={() => { setShowAddAircraftModal(false); fetchCounts(); }} />
      <AddAdminModal visible={showAddAdminModal} onClose={() => { setShowAddAdminModal(false); fetchCounts(); }} />
      <CompleteFlightModal visible={showCompleteFlightModal} onClose={() => setShowCompleteFlightModal(false)} onComplete={() => setShowCompleteFlightModal(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#007AFF', padding: 30, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginLeft: 10 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  statsRow: { flexDirection: 'row', padding: 20, gap: 10 },
  statCard: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#007AFF' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 5, textAlign: 'center' },
  buttonSection: { padding: 20, paddingTop: 0 },
  completeButton: { backgroundColor: '#9C27B0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  completeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  menuSection: { padding: 20, paddingTop: 0 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  menuItem: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 12 },
  countBadge: { backgroundColor: '#FF3B30', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  countText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  backdoorButton: { backgroundColor: '#FF6B6B', margin: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
  backdoorText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  addAdminButton: { backgroundColor: '#4CAF50', margin: 20, marginTop: 10, padding: 15, borderRadius: 12, alignItems: 'center' },
  addAdminText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});