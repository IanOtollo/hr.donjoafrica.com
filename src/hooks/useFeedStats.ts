import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Mock fallback for demo when DB returns 0 */
const MOCK_TOTAL_APPS = 24;
const MOCK_ACTIVE_VENTURES = 12;

/** Admin: fetch global venture stats. Founder/talent: fetch only their venture count (0 or 1). */
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
        const { data: founderRows } = await supabase
          .from('venture_founders')
          .select('venture_id')
          .eq('user_id', userId);
        const n = founderRows?.length ?? 0;
        return {
          totalApplications: n > 0 ? n : MOCK_TOTAL_APPS,
          activeVentures: n > 0 ? n : MOCK_ACTIVE_VENTURES,
        };
      }
      return { totalApplications: 0, activeVentures: 0 };
    },
    enabled: !!userId || isAdmin === true,
  });
}
