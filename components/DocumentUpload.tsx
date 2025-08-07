import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface DocumentUploadProps {
  title: string;
  required?: boolean;
  onUpload: (uri: string | null) => void;
  uploadedUri?: string | null;
}

export default function DocumentUpload({ title, required = false, onUpload, uploadedUri }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onUpload(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      {uploadedUri ? (
        <View style={styles.uploadedContainer}>
          <View style={styles.uploadedInfo}>
            <Ionicons name="checkmark-circle" size={24} color="#28a745" />
            <Text style={styles.uploadedText}>Document uploaded</Text>
          </View>
          <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
            <Ionicons name="trash" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.uploadButton} 
          onPress={pickImage}
          disabled={uploading}
        >
          <Ionicons name="cloud-upload" size={24} color="#007AFF" />
          <Text style={styles.uploadText}>
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  required: {
    color: '#dc3545',
  },
  uploadButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  uploadText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  uploadedContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  uploadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedText: {
    color: '#28a745',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  removeButton: {
    padding: 5,
  },
});