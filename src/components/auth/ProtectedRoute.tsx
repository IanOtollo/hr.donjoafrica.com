import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, isHardcodedAdmin } from '@/context/AuthContext';

const ADMIN_ROLES = ['employer', 'investor'];
const FOUNDER_ROLES = ['founder'];
const APPLICANT_ROLES = ['talent'];

export function isAdminRole(userType?: string): boolean {
  return !!userType && ADMIN_ROLES.includes(userType);
}

export function isFounderRole(userType?: string): boolean {
  return !!userType && FOUNDER_ROLES.includes(userType);
}

export function isApplicantRole(userType?: string): boolean {
  return !!userType && APPLICANT_ROLES.includes(userType);
}

/**
 * Redirects authenticated users to their role-appropriate dashboard when visiting /feed or /dashboard.
 */
export function useRoleBasedRedirect() {
  const { profile, user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHardcodedAdminUser = isHardcodedAdmin(user?.email);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (isHardcodedAdminUser && (location.pathname === '/feed' || location.pathname === '/dashboard')) {
      navigate('/admin', { replace: true });
      return;
    }
    if (!profile?.user_type) return;

    const path = location.pathname;
    if (path === '/feed' || path === '/dashboard') {
      if (isAdminRole(profile.user_type)) {
        navigate('/admin', { replace: true });
      } else if (isFounderRole(profile.user_type)) {
        navigate('/founder', { replace: true });
      }
    }
  }, [profile?.user_type, user?.email, isLoading, isAuthenticated, navigate, location.pathname, isHardcodedAdminUser]);
}

/**
 * Returns the correct dashboard path for the current user's role.
 */
export function useDashboardPath(): string {
  const { profile } = useAuth();
  if (isAdminRole(profile?.user_type)) return '/admin';
  if (isFounderRole(profile?.user_type)) return '/founder';
  if (isApplicantRole(profile?.user_type)) return '/feed';
  return '/feed';
}
