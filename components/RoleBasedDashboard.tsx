import React from 'react';
import AdminDashboard from './AdminDashboard';
import InstructorDashboard from './InstructorDashboard';
import StudentDashboard from './StudentDashboard';

interface RoleBasedDashboardProps {
  userRole: string;
}

export default function RoleBasedDashboard({ userRole }: RoleBasedDashboardProps) {
  // Go directly to role-specific dashboard without profile completion checks
  switch (userRole) {
    case 'administrator':
      return <AdminDashboard userRole={userRole} />;
    case 'instructor':
      return <InstructorDashboard userRole={userRole} />;
    case 'student':
      return <StudentDashboard userRole={userRole} />;
    default:
      return <StudentDashboard userRole="student" />;
  }
}