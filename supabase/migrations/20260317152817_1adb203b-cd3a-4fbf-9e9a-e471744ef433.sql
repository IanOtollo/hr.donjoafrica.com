
-- HR Reviews table for admin ratings, AI summaries, and team comments
CREATE TABLE public.hr_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_summary text,
  ai_logic_score integer CHECK (ai_logic_score >= 1 AND ai_logic_score <= 10),
  manual_rating integer CHECK (manual_rating >= 1 AND manual_rating <= 10),
  comment text,
  is_shortlisted boolean DEFAULT false,
  interview_scheduled_at timestamp with time zone,
  google_calendar_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_hr_reviews_venture_id ON public.hr_reviews(venture_id);
CREATE INDEX idx_hr_reviews_reviewer_id ON public.hr_reviews(reviewer_id);

-- Enable RLS
ALTER TABLE public.hr_reviews ENABLE ROW LEVEL SECURITY;

-- Only admin roles (employer/investor) can manage reviews
CREATE POLICY "Admins can view all reviews" ON public.hr_reviews
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'investor')
  );

CREATE POLICY "Admins can create reviews" ON public.hr_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    (public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'investor'))
  );

CREATE POLICY "Admins can update their reviews" ON public.hr_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Admins can delete their reviews" ON public.hr_reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id);

-- Updated_at trigger
CREATE TRIGGER update_hr_reviews_updated_at
  BEFORE UPDATE ON public.hr_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
