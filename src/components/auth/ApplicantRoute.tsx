import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { isApplicantRole, isAdminRole, isFounderRole } from './ProtectedRoute';
import { isHardcodedAdmin } from '@/context/AuthContext';

interface ApplicantRouteProps {
  children: React.ReactNode;
}

export function ApplicantRoute({ children }: ApplicantRouteProps) {
  const navigate = useNavigate();
  const { profile, user, isLoading, isAuthenticated } = useAuth();
  const isAdmin = isHardcodedAdmin(user?.email) || isAdminRole(profile?.user_type);
  const isFounder = isFounderRole(profile?.user_type);
  const isApplicant = isApplicantRole(profile?.user_type);
  const canAccess = isAuthenticated && !isAdmin && (isApplicant || (!isFounder && !profile?.user_type));

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (isAdmin) {
      navigate('/admin');
      return;
    }
    if (isFounder) {
      navigate('/founder');
    }
  }, [profile?.user_type, user?.email, isLoading, isAuthenticated, navigate, isAdmin, isFounder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Loading..." />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Redirecting..." />
      </div>
    );
  }

  return <>{children}</>;
}
