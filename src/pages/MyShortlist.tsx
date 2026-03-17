import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Briefcase, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RocketLoader } from '@/components/ui/RocketLoader';

interface ShortlistedApplicant {
  id: string;
  applicant_id: string;
  job_id: string;
  status: string;
  created_at: string;
  applicant: { id?: string; username?: string | null; avatar?: string | null; skill_category?: string };
  job: { id?: string; title?: string; company_name?: string | null };
}

export default function MyShortlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ShortlistedApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const { data: jobs } = await supabase
        .from('job_postings')
        .select('id')
        .eq('employer_id', uid);
      const jobIds = jobs?.map((j) => j.id) ?? [];
      if (jobIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const { data: applications } = await supabase
        .from('job_applications')
        .select(`
          id, applicant_id, job_id, status, created_at,
          applicant:profiles!job_applications_applicant_id_fkey(id, username, avatar, skill_category),
          job:job_postings(id, title, company_name)
        `)
        .in('job_id', jobIds)
        .eq('status', 'shortlisted')
        .order('created_at', { ascending: false });

      const mapped: ShortlistedApplicant[] = (applications ?? []).map((a: Record<string, unknown>) => {
        const app = a.applicant as Record<string, unknown> | Record<string, unknown>[] | null;
        const job = a.job as Record<string, unknown> | Record<string, unknown>[] | null;
        return {
          id: a.id as string,
          applicant_id: a.applicant_id as string,
          job_id: a.job_id as string,
          status: a.status as string,
          created_at: a.created_at as string,
          applicant: (Array.isArray(app) ? app[0] ?? {} : app ?? {}) as ShortlistedApplicant['applicant'],
          job: (Array.isArray(job) ? job[0] ?? {} : job ?? {}) as ShortlistedApplicant['job'],
        };
      });
      setItems(mapped);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-charcoal mb-1">My Shortlist</h1>
          <p className="text-cool-grey text-sm">Talent you've shortlisted across your jobs</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <RocketLoader indeterminate label="Loading shortlist..." />
          </div>
        ) : items.length === 0 ? (
          <NeoCard className="p-8 lg:p-12 text-center">
            <div className="h-16 w-16 neo-pressed rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">No shortlisted talent yet</h2>
            <p className="text-cool-grey text-sm mb-6 max-w-sm mx-auto">
              Shortlist applicants from your job postings to save them here for easy access.
            </p>
            <Button onClick={() => navigate('/employer')} className="neo-extruded">
              <Briefcase className="h-4 w-4 mr-2" />
              View My Jobs
            </Button>
          </NeoCard>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <NeoCard
                key={item.id}
                className="p-4 lg:p-5 rounded-2xl cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => navigate(`/employer/jobs/${item.job_id}/applicants`)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                      {item.applicant?.avatar ? (
                        <img src={item.applicant.avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-charcoal truncate">
                        {item.applicant?.username || 'Applicant'}
                      </p>
                      <p className="text-sm text-cool-grey truncate">
                        {item.job?.title || 'Job'} · {item.job?.company_name || 'Company'}
                      </p>
                      <p className="text-xs text-cool-grey mt-0.5">
                        Shortlisted {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-400/30">
                      <Bookmark className="h-3.5 w-3.5 fill-current" /> Shortlisted
                    </span>
                    <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                      <ChevronRight className="h-5 w-5 text-cool-grey" />
                    </Button>
                  </div>
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
