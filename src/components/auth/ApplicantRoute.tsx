import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { isApplicantRole } from './ProtectedRoute';

interface ApplicantRouteProps {
  children: React.ReactNode;
}

export function ApplicantRoute({ children }: ApplicantRouteProps) {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isApplicantRole(profile?.user_type)) {
      navigate('/feed');
    }
  }, [profile, isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated || !isApplicantRole(profile?.user_type)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Redirecting..." />
      </div>
    );
  }

  return <>{children}</>;
}
