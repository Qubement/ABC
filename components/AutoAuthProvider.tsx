import React from 'react';

interface AutoAuthProviderProps {
  children: React.ReactNode;
}

export default function AutoAuthProvider({ children }: AutoAuthProviderProps) {
  // No authentication required - just render children directly
  return <>{children}</>;
}