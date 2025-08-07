import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CompleteFlightModal from './CompleteFlightModal';

interface CompleteFlightButtonProps {
  style?: any;
}

export default function CompleteFlightButton({ style }: CompleteFlightButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    setShowModal(true);
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.button, style]}
        onPress={handlePress}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color="white" />
        <Text style={styles.buttonText}>Complete Flight</Text>
      </TouchableOpacity>
      
      <CompleteFlightModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 12,
  },
});