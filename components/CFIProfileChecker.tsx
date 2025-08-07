import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { supabase } from '../app/lib/supabase';
import CFIProfileForm from './CFIProfileForm';

interface CFIProfileCheckerProps {
  children: React.ReactNode;
}

export default function CFIProfileChecker({ children }: CFIProfileCheckerProps) {
  const { userEmail, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === 'instructor' && userEmail) {
      checkCFIProfile();
    } else {
      setLoading(false);
    }
  }, [userRole, userEmail]);

  const checkCFIProfile = async () => {
    try {
      console.log('CFIProfileChecker: Checking profile for email:', userEmail);
      setError(null);
      
      const { data, error } = await supabase
        .from('cfis')
        .select('first_name, last_name, phone, profile_completed')
        .eq('email', userEmail)
        .maybeSingle();

      console.log('CFIProfileChecker: Profile data:', data);
      console.log('CFIProfileChecker: Profile error:', error);

      if (error) {
        console.error('CFIProfileChecker: Database error:', error);
        setError(`Database error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('CFIProfileChecker: No CFI record found, showing profile form');
        setProfileIncomplete(true);
      } else if (!data.first_name || !data.last_name || !data.phone || !data.profile_completed) {
        console.log('CFIProfileChecker: Profile incomplete, showing profile form');
        setProfileIncomplete(true);
      } else {
        console.log('CFIProfileChecker: Profile complete, showing dashboard');
        setProfileIncomplete(false);
      }
    } catch (error) {
      console.error('CFIProfileChecker: Unexpected error:', error);
      setError(`Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    console.log('CFIProfileChecker: Profile completed, refreshing...');
    setProfileIncomplete(false);
    // Optionally refresh the profile check
    checkCFIProfile();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Checking profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading profile:</Text>
        <Text style={styles.errorDetails}>{error}</Text>
        <Text style={styles.errorHint}>Please try logging out and back in.</Text>
      </View>
    );
  }

  if (profileIncomplete) {
    return <CFIProfileForm onComplete={handleProfileComplete} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});