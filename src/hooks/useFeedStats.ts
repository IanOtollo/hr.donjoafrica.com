import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Mock fallback for admin demo only when DB returns 0. Never used for applicants. */
const MOCK_TOTAL_APPS = 24;
const MOCK_ACTIVE_VENTURES = 12;

/** Admin: global venture stats. Applicants: only their job applications. No admin data for normal users. */
export function useFeedStats(userId?: string, isAdmin?: boolean) {
  return useQuery({
    queryKey: ['feed-stats', userId ?? 'anon', isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const { count: total } = await supabase
          .from('ventures')
          .select('*', { count: 'exact', head: true });
        const { count: active } = await supabase
          .from('ventures')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        const t = total ?? 0;
        const a = active ?? 0;
        return {
          totalApplications: t > 0 ? t : MOCK_TOTAL_APPS,
          activeVentures: a > 0 ? a : MOCK_ACTIVE_VENTURES,
        };
      }
      if (userId) {
        const { count: jobsApplied } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('applicant_id', userId);
        const { count: shortlisted } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .eq('applicant_id', userId)
          .eq('status', 'shortlisted');
        return {
          totalApplications: jobsApplied ?? 0,
          activeVentures: shortlisted ?? 0,
        };
      }
      return { totalApplications: 0, activeVentures: 0 };
    },
    enabled: !!userId || isAdmin === true,
  });
}
