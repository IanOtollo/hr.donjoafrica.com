import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HrReview {
  id: string;
  venture_id: string;
  reviewer_id: string;
  ai_summary: string | null;
  ai_logic_score: number | null;
  manual_rating: number | null;
  comment: string | null;
  is_shortlisted: boolean;
  interview_scheduled_at: string | null;
  google_calendar_link: string | null;
  created_at: string;
  updated_at: string;
}

export function useHrReviews(ventureId?: string) {
  return useQuery({
    queryKey: ['hr-reviews', ventureId],
    queryFn: async () => {
      let query = supabase.from('hr_reviews').select('*');
      if (ventureId) query = query.eq('venture_id', ventureId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as HrReview[];
    },
    enabled: true,
  });
}

export function useAllHrReviews() {
  return useQuery({
    queryKey: ['hr-reviews-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as HrReview[];
    },
  });
}

export function useCreateHrReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: Partial<HrReview> & { venture_id: string; reviewer_id: string }) => {
      const { data, error } = await supabase.from('hr_reviews').insert(review).select().single();
      if (error) throw error;
      return data as HrReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['hr-reviews-all'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to save review'),
  });
}

export function useUpdateHrReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HrReview> & { id: string }) => {
      const { data, error } = await supabase.from('hr_reviews').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as HrReview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['hr-reviews-all'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to update review'),
  });
}

export async function generateAiReview(venture: {
  name: string;
  tagline: string;
  description?: string | null;
  problem_statement?: string | null;
  solution?: string | null;
  industry?: string[] | null;
  stage?: string;
  founder_name?: string | null;
}) {
  const { data, error } = await supabase.functions.invoke('ai-review', {
    body: {
      ventureName: venture.name,
      tagline: venture.tagline,
      description: venture.description,
      problemStatement: venture.problem_statement,
      solution: venture.solution,
      industry: venture.industry,
      stage: venture.stage,
      founderName: venture.founder_name,
    },
  });
  if (error) throw error;
  return data as { summary: string; logic_score: number; strengths: string[]; concerns: string[] };
}
