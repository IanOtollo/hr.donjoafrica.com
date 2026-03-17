import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, isHardcodedAdmin } from '@/context/AuthContext';
import { RocketLoader } from '@/components/ui/RocketLoader';

const ADMIN_ROLES = ['employer', 'investor'] as const;

function isAdminRole(userType?: string): boolean {
  return !!userType && ADMIN_ROLES.includes(userType as typeof ADMIN_ROLES[number]);
}

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const navigate = useNavigate();
  const { profile, isLoading, isAuthenticated, user } = useAuth();
  const isAdmin = isHardcodedAdmin(user?.email) || isAdminRole(profile?.user_type);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (!isAdmin) navigate('/feed');
  }, [isAdmin, isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RocketLoader indeterminate label="Redirecting..." />
      </div>
    );
  }

  return <>{children}</>;
}
