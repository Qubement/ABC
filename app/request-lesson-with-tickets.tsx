import React from 'react';
import { View, StyleSheet } from 'react-native';
import RequestLessonFormFinal from '../components/RequestLessonFormFinal';

export default function RequestLessonWithTickets() {
  return (
    <View style={styles.container}>
      <RequestLessonFormFinal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  }
});