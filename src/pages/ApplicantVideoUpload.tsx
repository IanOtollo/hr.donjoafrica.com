import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VideoPitchRecorder } from '@/components/apply/VideoPitchRecorder';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ApplicantVideoUpload() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadVideo, uploading } = useVideoUpload();
  const [done, setDone] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const handleVideoReady = async (blob: Blob) => {
    if (!user?.id) {
      toast.error('Please log in to upload');
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    const videoUrl = await uploadVideo(blob, user.id);
    if (!videoUrl) {
      toast.error('Failed to upload video');
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from('videos').insert({
      user_id: user.id,
      video_url: videoUrl,
      title: 'Portfolio Video',
      description: 'Video portfolio submission',
      is_private: false,
    });
    if (error) {
      toast.error('Failed to save video');
      setSubmitting(false);
      return;
    }
    toast.success('Video added to your portfolio!');
    setDone(true);
    setTimeout(() => navigate('/profile'), 1500);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-cool-grey">Please log in to add a video.</p>
          <Button onClick={() => navigate('/auth')} className="mt-4">Log In</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <NeoCard className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-charcoal">Add Video to Portfolio</h1>
              <p className="text-cool-grey text-sm">Record or upload a video to showcase your skills</p>
            </div>
          </div>
          {done ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-charcoal font-medium">Redirecting to your portfolio...</p>
            </div>
          ) : (
            <VideoPitchRecorder onVideoReady={handleVideoReady} maxDuration={60} />
          )}
          {(uploading || submitting) && (
            <div className="mt-4 flex items-center gap-2 text-cool-grey text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? 'Uploading video...' : 'Saving to portfolio...'}
            </div>
          )}
        </NeoCard>
      </div>
    </DashboardLayout>
  );
}
