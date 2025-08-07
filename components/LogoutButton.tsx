import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoutButtonProps {
  style?: any;
  textStyle?: any;
  showIcon?: boolean;
  variant?: 'primary' | 'secondary' | 'text';
}

export default function LogoutButton({ 
  style, 
  textStyle, 
  showIcon = true, 
  variant = 'primary' 
}: LogoutButtonProps) {

  const handleLogout = () => {
    // Logout disabled - no action needed
    console.log('Logout disabled - authentication removed');
  };

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryButton, style];
      case 'text':
        return [styles.textButton, style];
      default:
        return [styles.primaryButton, style];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryButtonText, textStyle];
      case 'text':
        return [styles.textButtonText, textStyle];
      default:
        return [styles.primaryButtonText, textStyle];
    }
  };

  return (
    <TouchableOpacity style={getButtonStyle()} onPress={handleLogout}>
      {showIcon && (
        <Ionicons 
          name="log-out" 
          size={16} 
          color={variant === 'primary' ? 'white' : '#FF3B30'} 
          style={styles.icon}
        />
      )}
      <Text style={getTextStyle()}>Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  textButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  textButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  icon: {
    marginRight: 6,
  },
});