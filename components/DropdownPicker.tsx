import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';

interface DropdownItem {
  label: string;
  value: string;
  id?: string;
}

interface DropdownPickerProps {
  items: DropdownItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function DropdownPicker({ 
  items, 
  value, 
  onValueChange, 
  placeholder = 'Select an option',
  disabled = false
}: DropdownPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedItem = items.find(item => item.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.selector, disabled && styles.disabledSelector]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[styles.selectorText, !selectedItem && styles.placeholder, disabled && styles.disabledText]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={[styles.arrow, disabled && styles.disabledText]}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen && !disabled}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdown}>
            <ScrollView style={styles.optionsContainer}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.value || index}
                  style={[
                    styles.option,
                    value === item.value && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[
                    styles.optionText,
                    value === item.value && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', marginBottom: 10 },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  disabledSelector: { backgroundColor: '#f5f5f5', borderColor: '#ccc' },
  selectorText: { fontSize: 16, color: '#333', flex: 1 },
  placeholder: { color: '#999' },
  disabledText: { color: '#999' },
  arrow: { fontSize: 12, color: '#666' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdown: { backgroundColor: '#fff', borderRadius: 8, maxHeight: 300, width: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  optionsContainer: { maxHeight: 250 },
  option: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  selectedOption: { backgroundColor: '#e3f2fd' },
  optionText: { fontSize: 16, color: '#333' },
  selectedOptionText: { color: '#1976d2', fontWeight: '600' }
});