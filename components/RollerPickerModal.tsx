import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RollerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  items: { label: string; value: string }[];
  onSelect: (value: string) => void;
  title: string;
  selectedValue?: string;
}

export default function RollerPickerModal({
  visible,
  onClose,
  items,
  onSelect,
  title,
  selectedValue
}: RollerPickerModalProps) {
  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.item,
                  selectedValue === item.value && styles.selectedItem
                ]}
                onPress={() => handleSelect(item.value)}
              >
                <Text style={[
                  styles.itemText,
                  selectedValue === item.value && styles.selectedText
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons name="checkmark" size={20} color="#45B7D1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 5
  },
  scrollView: {
    maxHeight: 400
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  selectedItem: {
    backgroundColor: '#f0f8ff'
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  selectedText: {
    color: '#45B7D1',
    fontWeight: '600'
  }
});