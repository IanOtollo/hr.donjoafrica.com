import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth, isHardcodedAdmin } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';

const EMPLOYER_ROLES = ['employer', 'investor'] as const;

function isEmployerRole(userType?: string): boolean {
  return !!userType && EMPLOYER_ROLES.includes(userType as typeof EMPLOYER_ROLES[number]);
}

export function EmployerRoute() {
  const navigate = useNavigate();
  const { profile, user, isLoading, isAuthenticated } = useAuth();
  const isEmployer = isHardcodedAdmin(user?.email) || isEmployerRole(profile?.user_type);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isEmployer) {
      navigate('/feed');
    }
  }, [profile?.user_type, user?.email, isLoading, isAuthenticated, isEmployer, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated || !isEmployer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Redirecting..." />
      </div>
    );
  }

  return <Outlet />;
}
