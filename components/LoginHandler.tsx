import React from 'react';
import { useAuth } from '../app/context/AuthContext';
import { router } from 'expo-router';

export const useLoginHandler = () => {
  const { login } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    // Auto-login without any validation
    await login('administrator', email || 'admin@example.com');
    router.replace('/(tabs)');
    return true;
  };

  return { handleLogin };
};

export default function LoginHandler() {
  return null;
}