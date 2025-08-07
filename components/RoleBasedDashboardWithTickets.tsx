import React from 'react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';

interface RoleBasedDashboardProps {
  userRole: string;
}

export default function RoleBasedDashboardWithTickets({ userRole }: RoleBasedDashboardProps) {
  // Go directly to role-specific dashboard
  switch (userRole) {
    case 'administrator':
      return <AdminDashboard />;
    case 'instructor':
      return <StudentDashboard userRole="instructor" />;
    case 'student':
      return <StudentDashboard userRole={userRole} />;
    default:
      return <StudentDashboard userRole="student" />;
  }
}