import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface RollerPickerProps {
  items: Array<{ id: string; label: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  maxHeight?: number;
}

export default function RollerPicker({ 
  items, 
  selectedId, 
  onSelect, 
  placeholder = 'Select an option',
  maxHeight = 150 
}: RollerPickerProps) {
  const selectedItem = items.find(item => item.id === selectedId);

  return (
    <View style={styles.container}>
      <View style={styles.selectedContainer}>
        <Text style={styles.selectedText}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </View>
      
      <ScrollView 
        style={[styles.optionsContainer, { maxHeight }]}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.option,
              selectedId === item.id && styles.selectedOption,
              index === items.length - 1 && styles.lastOption
            ]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[
              styles.optionText,
              selectedId === item.id && styles.selectedOptionText
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  optionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#1976d2',
    fontWeight: '600',
  },
});