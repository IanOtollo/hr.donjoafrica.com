import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApplicantJobApplications } from '@/hooks/useApplicantJobApplications';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; step: number }> = {
  pending: { label: 'Applied', color: 'bg-blue-500/10 text-blue-600', icon: <Clock className="h-4 w-4" />, step: 1 },
  submitted: { label: 'Applied', color: 'bg-blue-500/10 text-blue-600', icon: <Clock className="h-4 w-4" />, step: 1 },
  reviewed: { label: 'In Review', color: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-4 w-4" />, step: 2 },
  shortlisted: { label: 'Shortlisted', color: 'bg-green-500/10 text-green-600', icon: <CheckCircle className="h-4 w-4" />, step: 3 },
  rejected: { label: 'Closed', color: 'bg-slate-500/10 text-slate-600', icon: <AlertCircle className="h-4 w-4" />, step: 4 },
};

const steps = ['Applied', 'Review', 'Interview', 'Decision'];

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
          <NeoCardContent className="space-y-6 mt-4">
            {jobApplications && jobApplications.length > 0 ? (
              jobApplications.map((app) => {
                const cfg = getStatusConfig(app.status);
                return (
                  <div key={app.id} className="neo-subtle rounded-3xl p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center shrink-0">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-charcoal text-lg">{app.job?.title || 'Position'}</p>
                          <p className="text-sm text-cool-grey">{app.job?.company_name || 'Organization'} · Applied {formatDate(app.created_at)}</p>
                        </div>
                      </div>
                      <Badge className={`${cfg.color} flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Progress Tracker */}
                    <div className="mt-8 pt-8 border-t border-border/30">
                      <div className="flex items-center justify-between relative px-2 sm:px-8">
                        {steps.map((step, idx) => {
                          const isPast = cfg.step > idx + 1;
                          const isCurrent = cfg.step === idx + 1;
                          const isRejected = app.status === 'rejected' && idx === 3;

                          return (
                            <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                                isPast ? "bg-primary border-primary text-white" :
                                isCurrent ? "bg-white border-primary text-primary shadow-lg shadow-primary/20 scale-110" :
                                isRejected ? "bg-destructive border-destructive text-white" :
                                "bg-white border-border text-cool-grey"
                              )}>
                                {isPast ? <CheckCircle className="h-5 w-5" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                              </div>
                              <span className={cn(
                                "text-[10px] sm:text-xs font-bold uppercase tracking-wider",
                                isCurrent ? "text-primary" : "text-cool-grey"
                              )}>{step}</span>
                            </div>
                          );
                        })}
                        {/* Progress Line */}
                        <div className="absolute top-5 left-8 right-8 h-[2px] bg-border -translate-y-1/2 z-0 hidden sm:block" />
                        <div 
                          className="absolute top-5 left-8 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-1000 ease-out hidden sm:block" 
                          style={{ width: `calc(${Math.max(0, (cfg.step - 1) * 33.33)}% - 4rem)` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="h-20 w-20 neo-pressed rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-10 w-10 text-cool-grey" />
                </div>
                <p className="text-cool-grey font-medium text-lg mb-4">You haven&apos;t applied to any jobs yet.</p>
                <Button onClick={() => navigate('/jobs')} className="neo-extruded border-none h-12 px-8">
                   Browse Job Postings
                </Button>
              </div>
            )}
          </NeoCardContent>
        </NeoCard>
      </div>
    </DashboardLayout>
  );
}

