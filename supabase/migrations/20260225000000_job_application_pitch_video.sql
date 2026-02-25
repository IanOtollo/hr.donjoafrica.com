-- Add pitch_video_id to job_applications so applicants can attach a job-specific video pitch
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS pitch_video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_pitch_video_id 
  ON public.job_applications(pitch_video_id);

COMMENT ON COLUMN public.job_applications.pitch_video_id IS 'Optional video pitch recorded/uploaded specifically for this application';

-- Allow employers to view pitch videos linked to applications for their jobs
CREATE POLICY "Employers can view pitch videos from job applications"
  ON public.videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.job_postings jp ON jp.id = ja.job_id
      WHERE ja.pitch_video_id = videos.id
        AND jp.employer_id = auth.uid()
    )
  );
