import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import CFIProfileForm from '../../components/CFIProfileForm';

export default function Profile() {
  const { userRole, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseType, setLicenseType] = useState('');
  const [hoursLogged, setHoursLogged] = useState('');
  const [certification, setCertification] = useState('');
  const [aircraftTypes, setAircraftTypes] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [adminLevel, setAdminLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  if (userRole === 'instructor') {
    return <CFIProfileForm onComplete={() => {}} />;
  }

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'administrator':
        return (
          <>
            <Text style={styles.sectionTitle}>Administrator Access</Text>
            <View style={styles.accessCard}>
              <Text style={styles.accessItem}>• Manage all student profiles</Text>
              <Text style={styles.accessItem}>• Manage flight instructor profiles</Text>
              <Text style={styles.accessItem}>• View all student payments</Text>
              <Text style={styles.accessItem}>• View all instructor payments</Text>
              <Text style={styles.accessItem}>• Add new CFI instructors</Text>
            </View>
            <Text style={styles.label}>Admin Level</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Super Admin" 
              value={adminLevel}
              onChangeText={setAdminLevel}
            />
            <Text style={styles.label}>Department</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Operations" 
              value={department}
              onChangeText={setDepartment}
            />
          </>
        );
      case 'student':
        return (
          <>
            <Text style={styles.sectionTitle}>Student Access</Text>
            <View style={styles.accessCard}>
              <Text style={styles.accessItem}>• View personal schedule</Text>
              <Text style={styles.accessItem}>• View personal payments</Text>
            </View>
            <Text style={styles.label}>Student ID</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Student ID" 
              value={studentId}
              onChangeText={setStudentId}
            />
            <Text style={styles.label}>License Type</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Private Pilot" 
              value={licenseType}
              onChangeText={setLicenseType}
            />
            <Text style={styles.label}>Hours Logged</Text>
            <TextInput 
              style={styles.input} 
              placeholder="25" 
              value={hoursLogged}
              onChangeText={setHoursLogged}
              keyboardType="numeric"
            />
          </>
        );
      default:
        return null;
    }
  };

  const getHeaderColor = () => {
    switch (userRole) {
      case 'administrator': return '#007AFF';
      case 'instructor': return '#4ECDC4';
      case 'student': return '#45B7D1';
      default: return '#007AFF';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { backgroundColor: getHeaderColor() }]}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>{userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone"
          keyboardType="phone-pad"
        />

        {getRoleSpecificContent()}

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: getHeaderColor() }]}
          onPress={() => Alert.alert('Success', 'Profile updated successfully')}
        >
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 30, paddingTop: 50, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 5 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: 'white', marginLeft: 5, fontWeight: '600' },
  form: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 20 },
  accessCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  accessItem: { fontSize: 14, color: '#666', marginBottom: 5 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  saveButton: { borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: '600' }
});