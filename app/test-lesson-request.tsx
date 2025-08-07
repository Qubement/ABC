import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LessonRequestTestRunner from '../components/LessonRequestTestRunner';

export default function TestLessonRequestPage() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Test Lesson Request (Fixed)</Text>
      </View>
      
      <LessonRequestTestRunner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#45B7D1',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15
  }
});