import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { supabase } from '../app/lib/supabase';
import { styles } from './AdminBackdoorStyles';
import AddStudentModal from './AddStudentModal';
import AddCFIModal from './AddCFIModal';
import AddAircraftModal from './AddAircraftModal';
import AddAdminModal from './AddAdminModal';
import AdminBackdoorEdit from './AdminBackdoorEdit';

interface AdminBackdoorProps {
  visible: boolean;
  onClose: () => void;
}

export default function AdminBackdoor({ visible, onClose }: AdminBackdoorProps) {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [cfis, setCfis] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddCFI, setShowAddCFI] = useState(false);
  const [showAddAircraft, setShowAddAircraft] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editRatings, setEditRatings] = useState({});

  useEffect(() => {
    if (visible) {
      fetchAllData();
    }
  }, [visible]);

  const fetchAllData = async () => {
    const [studentsRes, cfisRes, aircraftRes, adminsRes] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('cfis').select('*'),
      supabase.from('aircraft').select('*'),
      supabase.from('admins').select('*')
    ]);
    setStudents(studentsRes.data || []);
    setCfis(cfisRes.data || []);
    setAircraft(aircraftRes.data || []);
    setAdmins(adminsRes.data || []);
  };

  const startEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setEditForm({ ...item });
    
    if (type === 'student') {
      const studentRatings = {
        PRIVATE: false, COMMERCIAL: false, INSTRUMENT: false,
        SEL: false, MEL: false, CFI: false, CFII: false, MEI: false
      };
      if (item.ratings && Array.isArray(item.ratings)) {
        item.ratings.forEach(rating => {
          if (studentRatings.hasOwnProperty(rating)) {
            studentRatings[rating] = true;
          }
        });
      }
      setEditRatings(studentRatings);
    } else if (type === 'cfi') {
      const cfiRatings = { CFI: false, CFII: false, MEI: false };
      if (item.ratings && Array.isArray(item.ratings)) {
        item.ratings.forEach(rating => {
          if (cfiRatings.hasOwnProperty(rating)) {
            cfiRatings[rating] = true;
          }
        });
      }
      setEditRatings(cfiRatings);
    }
  };

  const handleRatingChange = (rating: string) => {
    setEditRatings(prev => ({ ...prev, [rating]: !prev[rating] }));
  };

  const deleteItem = async () => {
    try {
      const table = editingItem.type === 'student' ? 'students' : 
                   editingItem.type === 'cfi' ? 'cfis' : 
                   editingItem.type === 'admin' ? 'admins' : 'aircraft';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      setEditingItem(null);
      setEditForm({});
      setEditRatings({});
      await fetchAllData();
      Alert.alert('Success', `${editingItem.type} deleted successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to delete ${editingItem.type}: ${error.message}`);
    }
  };

  const saveEdit = async () => {
    try {
      const { type, ...updateData } = editForm;
      const table = editingItem.type === 'student' ? 'students' : 
                   editingItem.type === 'cfi' ? 'cfis' : 
                   editingItem.type === 'admin' ? 'admins' : 'aircraft';
      
      if (updateData.hourly_rate) {
        updateData.hourly_rate = parseFloat(updateData.hourly_rate);
      }
      
      if (editingItem.type === 'student' || editingItem.type === 'cfi') {
        const selectedRatings = Object.keys(editRatings).filter(key => editRatings[key]);
        updateData.ratings = selectedRatings;
      }
      
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', editForm.id);
      
      if (error) throw error;
      
      setEditingItem(null);
      setEditForm({});
      setEditRatings({});
      await fetchAllData();
      Alert.alert('Success', 'Info updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update item: ${error.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditForm({});
    setEditRatings({});
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'students': return students;
      case 'cfis': return cfis;
      case 'aircraft': return aircraft;
      case 'admins': return admins;
      default: return [];
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Database Manager</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabs}>
          {['students', 'cfis', 'aircraft', 'admins'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'cfis' ? 'CFIs' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={() => {
          if (activeTab === 'students') setShowAddStudent(true);
          else if (activeTab === 'cfis') setShowAddCFI(true);
          else if (activeTab === 'aircraft') setShowAddAircraft(true);
          else if (activeTab === 'admins') setShowAddAdmin(true);
        }}>
          <Text style={styles.addButtonText}>
            + ADD {activeTab === 'aircraft' ? 'AIRCRAFT' : activeTab === 'admins' ? 'ADMIN' : activeTab.toUpperCase().slice(0, -1)}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <FlatList
            data={getCurrentData()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item}>
                <Text style={styles.itemTitle}>
                  {activeTab === 'aircraft' ? item.tail_number :
                   `${item.first_name || ''} ${item.last_name || ''}`}
                </Text>
                <Text style={styles.itemSubtitle}>
                  {activeTab === 'aircraft' ? `${item.make} ${item.model}` : item.email}
                </Text>
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => startEdit(item, activeTab.slice(0, -1))}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
        
        <AdminBackdoorEdit
          editingItem={editingItem}
          editForm={editForm}
          editRatings={editRatings}
          setEditForm={setEditForm}
          handleRatingChange={handleRatingChange}
          saveEdit={saveEdit}
          cancelEdit={cancelEdit}
          deleteItem={deleteItem}
          refreshData={fetchAllData}
        />
        
        <AddStudentModal visible={showAddStudent} onClose={() => { setShowAddStudent(false); fetchAllData(); }} />
        <AddCFIModal visible={showAddCFI} onClose={() => { setShowAddCFI(false); fetchAllData(); }} />
        <AddAircraftModal visible={showAddAircraft} onClose={() => { setShowAddAircraft(false); fetchAllData(); }} />
        <AddAdminModal visible={showAddAdmin} onClose={() => { setShowAddAdmin(false); fetchAllData(); }} />
      </View>
    </Modal>
  );
}