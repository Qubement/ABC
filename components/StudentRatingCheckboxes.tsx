import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StudentRatingCheckboxesProps {
  ratings: string[];
  onRatingChange: (rating: string) => void;
}

const availableRatings = [
  'Student',
  'Private',
  'Instrument',
  'Commercial',
  'ATP',
  'Multi-Engine',
  'Seaplane',
  'Glider',
  'Sport Pilot'
];

export default function StudentRatingCheckboxes({ ratings, onRatingChange }: StudentRatingCheckboxesProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Student Ratings</Text>
      {availableRatings.map(rating => (
        <TouchableOpacity
          key={rating}
          style={styles.checkboxRow}
          onPress={() => onRatingChange(rating)}
        >
          <Ionicons
            name={ratings.includes(rating) ? 'checkbox' : 'square-outline'}
            size={24}
            color={ratings.includes(rating) ? '#4ECDC4' : '#666'}
          />
          <Text style={styles.checkboxLabel}>{rating}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
});