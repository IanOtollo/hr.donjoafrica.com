import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';

const FOUNDER_ROLES = ['founder'] as const;

function isFounderRole(userType?: string): boolean {
  return !!userType && FOUNDER_ROLES.includes(userType as typeof FOUNDER_ROLES[number]);
}

interface CandidateRouteProps {
  children: React.ReactNode;
}

export function CandidateRoute({ children }: CandidateRouteProps) {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isFounderRole(profile?.user_type)) {
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

  if (!isAuthenticated || !isFounderRole(profile?.user_type)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Redirecting..." />
      </div>
    );
  }

  return <>{children}</>;
}
