import React from 'react';
import { View } from 'react-native';
import RequestLessonFormWithVerification from '../components/RequestLessonFormWithVerification';

export default function RequestLessonPage() {
  return (
    <View style={{ flex: 1 }}>
      <RequestLessonFormWithVerification />
    </View>
  );
}