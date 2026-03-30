import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { ApplicantLayout } from './ApplicantLayout';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const location = useLocation();

  // Theme sync: ensure light theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/employer');
  const isAdminUser = profile?.user_type === 'employer' || profile?.user_type === 'judge';

  // If it's an admin path or an admin user, use the AdminLayout
  if (isAdminPath || isAdminUser) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Default to ApplicantLayout
  return <ApplicantLayout>{children}</ApplicantLayout>;
}
