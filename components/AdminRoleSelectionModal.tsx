import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AdminRoleSelectionModalProps {
  visible: boolean;
  onSelectAdmin: () => void;
  onSelectCFI: () => void;
}

export default function AdminRoleSelectionModal({ 
  visible, 
  onSelectAdmin, 
  onSelectCFI 
}: AdminRoleSelectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Ionicons name="person-circle" size={40} color="#007AFF" />
            <Text style={styles.title}>Select Login Role</Text>
            <Text style={styles.subtitle}>
              You have both Admin and CFI access. Please select how you'd like to login:
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.roleButton, styles.adminButton]} 
              onPress={onSelectAdmin}
            >
              <Ionicons name="shield-checkmark" size={24} color="white" />
              <Text style={styles.buttonText}>Login as Admin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.roleButton, styles.cfiButton]} 
              onPress={onSelectCFI}
            >
              <Ionicons name="airplane" size={24} color="white" />
              <Text style={styles.buttonText}>Login as CFI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  adminButton: {
    backgroundColor: '#007AFF',
  },
  cfiButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});