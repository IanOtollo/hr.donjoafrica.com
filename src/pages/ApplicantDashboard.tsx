import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApplicantJobApplications } from '@/hooks/useApplicantJobApplications';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Under Review', color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-4 w-4" /> },
  submitted: { label: 'Under Review', color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-4 w-4" /> },
  shortlisted: { label: 'Shortlisted', color: 'bg-green-500/10 text-green-600', icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: 'Not Selected', color: 'bg-slate-500/10 text-slate-600', icon: <AlertCircle className="h-4 w-4" /> },
  reviewed: { label: 'Reviewed', color: 'bg-blue-500/10 text-blue-600', icon: <CheckCircle className="h-4 w-4" /> },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { data: jobApplications } = useApplicantJobApplications(user?.id);

  const getStatusConfig = (status: string) => statusConfig[status] || statusConfig.pending;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto w-full overflow-x-hidden px-1 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-charcoal mb-1">
            Welcome, {profile?.username || 'Applicant'}
          </h1>
          <p className="text-cool-grey text-sm lg:text-base">Track your job applications</p>
        </div>

        <NeoCard className="p-5 lg:p-6">
          <NeoCardHeader>
            <NeoCardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              My Job Applications
            </NeoCardTitle>
            <p className="text-cool-grey text-sm mt-1">View the status of jobs you&apos;ve applied to</p>
          </NeoCardHeader>
          <NeoCardContent className="space-y-4 mt-4">
            {jobApplications && jobApplications.length > 0 ? (
              jobApplications.map((app) => {
                const cfg = getStatusConfig(app.status);
                return (
                  <div key={app.id} className="neo-subtle rounded-2xl p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 neo-pressed rounded-xl flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal">{app.job?.title || 'Job'}</p>
                          <p className="text-xs text-cool-grey">{app.job?.company_name || 'Company'} · {formatDate(app.created_at)}</p>
                        </div>
                      </div>
                      <Badge className={`${cfg.color} flex items-center gap-1.5 px-3 py-1`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-cool-grey mb-4">You haven&apos;t applied to any jobs yet.</p>
                <Button onClick={() => navigate('/jobs')} className="neo-extruded border-none">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </div>
            )}
          </NeoCardContent>
        </NeoCard>
      </div>
    </DashboardLayout>
  );
}
