import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

type UserRole = 'administrator' | 'instructor' | 'student' | null;

interface AuthContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (role: UserRole, userEmail?: string) => void;
  logout: () => void;
  userId: string;
  userEmail: string;
  profileCompleted: boolean;
  setProfileCompleted: (completed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('administrator');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userId, setUserId] = useState<string>('auto-admin-user');
  const [userEmail, setUserEmail] = useState<string>('admin@example.com');
  const [profileCompleted, setProfileCompleted] = useState(true);

  const login = async (role: UserRole, email?: string) => {
    console.log('AuthContext: Login with role:', role, 'email:', email);
    setUserRole(role || 'administrator');
    setIsAuthenticated(true);
    setUserEmail(email || 'admin@example.com');
    setUserId('auto-user-' + Date.now());
    setProfileCompleted(true);
  };

  const logout = async () => {
    setUserRole('administrator');
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{
      userRole,
      setUserRole,
      isAuthenticated,
      login,
      logout,
      userId,
      userEmail,
      profileCompleted,
      setProfileCompleted
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}