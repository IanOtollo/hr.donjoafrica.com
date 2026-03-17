import { useAuth, isHardcodedAdmin } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { Activity, UserPlus, FileCheck, MessageSquare, Clock } from 'lucide-react';

const mockActivity = [
  { icon: UserPlus, action: 'New application received', detail: 'FinTech startup — 2 hours ago', color: 'text-green-600' },
  { icon: FileCheck, action: 'Application reviewed', detail: 'HealthTech venture shortlisted', color: 'text-blue-600' },
  { icon: MessageSquare, action: 'Message sent', detail: 'Follow-up with candidate', color: 'text-amber-600' },
  { icon: UserPlus, action: 'New application received', detail: 'EdTech project — 5 hours ago', color: 'text-green-600' },
  { icon: FileCheck, action: 'Application reviewed', detail: 'AgriTech — rejected', color: 'text-red-600' },
];

export default function ActivityLog() {
  const { isAuthenticated, isLoading, user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isHardcodedAdmin(user?.email) || profile?.user_type === 'employer' || profile?.user_type === 'investor';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/auth');
    if (!isLoading && isAuthenticated && !isAdmin) navigate('/feed');
  }, [isAuthenticated, isLoading, isAdmin, navigate]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Activity Log</h1>
          <p className="text-cool-grey text-sm">Recent actions and updates</p>
        </div>
        <NeoCard className="p-5">
          <div className="space-y-4">
            {mockActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                <div className="h-10 w-10 neo-subtle rounded-xl flex items-center justify-center flex-shrink-0">
                  <a.icon className={`h-5 w-5 ${a.color}`} />
                </div>
                <div>
                  <p className="font-medium text-charcoal">{a.action}</p>
                  <p className="text-sm text-cool-grey">{a.detail}</p>
                </div>
                <Clock className="h-4 w-4 text-cool-grey ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        </NeoCard>
      </div>
    </DashboardLayout>
  );
}
