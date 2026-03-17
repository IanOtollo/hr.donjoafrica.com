import { useAuth, isHardcodedAdmin } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

export default function Insights() {
  const { isAuthenticated, isLoading, user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isHardcodedAdmin(user?.email) || profile?.user_type === 'employer' || profile?.user_type === 'investor';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/auth');
    if (!isLoading && isAuthenticated && !isAdmin) navigate('/feed');
  }, [isAuthenticated, isLoading, isAdmin, navigate]);

  const metrics = [
    { icon: Users, label: 'Top applying sector', value: 'FinTech', sub: '32% of applications' },
    { icon: Target, label: 'Avg. time to hire', value: '12 days', sub: 'From application to offer' },
    { icon: TrendingUp, label: 'Conversion rate', value: '18%', sub: 'Application to shortlist' },
    { icon: BarChart3, label: 'Peak apply day', value: 'Tuesday', sub: 'Most submissions' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Insights</h1>
          <p className="text-cool-grey text-sm">Key metrics and trends</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m) => (
            <NeoCard key={m.label} className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center">
                  <m.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-cool-grey uppercase tracking-wider">{m.label}</p>
                  <p className="text-xl font-bold text-charcoal">{m.value}</p>
                  <p className="text-xs text-cool-grey">{m.sub}</p>
                </div>
              </div>
            </NeoCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
