import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Briefcase, Clock, Building2, ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ApplyJobModal } from '@/components/jobs/ApplyJobModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface JobPosting {
  id: string;
  slug?: string | null;
  title: string;
  description: string;
  company_name: string | null;
  company_logo: string | null;
  location: string | null;
  job_type: string;
  experience_level: string | null;
  skills_required: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  video_prompt?: string | null;
  created_at: string;
}

export default function JobDetail() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  const [job, setJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hasApplied, setHasApplied] = useState(false);
  
  // The Apply Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);

  // If the user arrived here from a deep-link specifically with '?apply=true' or the route '/apply', we auto-open it if logged in.
  const isDeepLinkedApply = location.pathname.endsWith('/apply');

  useEffect(() => {
    if (identifier) {
      fetchJob();
    }
  }, [identifier]);

  useEffect(() => {
    if (user && job) {
      checkApplicationStatus();
    }
    // If they were dumped here via deep-link to apply & are logged in, auto-open the modal
    if (user && job && isDeepLinkedApply && !hasApplied) {
      setShowApplyModal(true);
    }
  }, [user, job, isDeepLinkedApply]);

  const fetchJob = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // We check if the identifier is a valid UUID, otherwise we assume it's a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier ?? '');
      
      let query: any = supabase.from('job_postings').select('*');
      
      if (isUUID) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', identifier);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      setJob(data);
    } catch (err) {
      console.error(err);
      setError('Job not found or is no longer active.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user || !job) return;
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', user.id)
        .eq('job_id', job.id)
        .maybeSingle();
      
      if (data) {
        setHasApplied(true);
      }
    } catch (err) {
      console.error('Failed to check application status:', err);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      // Deep Link Redirect: Send them to auth, and upon success back to the specific apply route!
      const finalLink = job?.slug || job?.id;
      navigate(`/auth?returnTo=/jobs/${finalLink}/apply`);
      return;
    }
    // Already authenticated? Open the modal natively here
    setShowApplyModal(true);
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'Full-time';
      case 'part-time': return 'Part-time';
      case 'contract': return 'Contract';
      case 'internship': return 'Internship';
      default: return type;
    }
  };

  const formatSalary = () => {
    if (!job) return null;
    if (!job.salary_min && !job.salary_max) return null;
    if (job.salary_min && job.salary_max) return `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`;
    if (job.salary_min) return `From $${(job.salary_min / 1000).toFixed(0)}k`;
    if (job.salary_max) return `Up to $${(job.salary_max / 1000).toFixed(0)}k`;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-cool-grey font-medium">Loading Job Profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 max-w-md mx-auto text-center space-y-4">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-charcoal">Posting Unavailable</h2>
          <p className="text-cool-grey">This job posting might have been removed, closed, or the link is invalid.</p>
          <Button onClick={() => navigate('/jobs')} variant="outline" className="mt-4">
            Browse Active Jobs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in relative pb-20">
        
        {/* Navigation Breadcrumb */}
        <button 
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-cool-grey hover:text-charcoal transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>

        {/* Hero Section */}
        <div className="neo-extruded rounded-3xl p-8 lg:p-10 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Briefcase className="w-64 h-64 -rotate-12" />
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
            {/* Logo */}
            <div className="h-24 w-24 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden shrink-0 neo-pressed">
              {job.company_logo ? (
                <img src={job.company_logo} alt={job.company_name || 'Company'} className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-cool-grey" />
              )}
            </div>

            {/* Core Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-charcoal mb-2 font-sans tracking-tight">
                  {job.title}
                </h1>
                <p className="text-lg text-cool-grey font-medium">{job.company_name || 'Confidential Employer'}</p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-cool-grey">
                {job.location && (
                  <span className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border/50">
                    <MapPin className="h-4 w-4 text-primary" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border/50 capitalize">
                  <Briefcase className="h-4 w-4 text-primary" />
                  {getJobTypeLabel(job.job_type)}
                </span>
                {formatSalary() && (
                  <span className="flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 rounded-lg border border-border/50 font-mono text-charcoal">
                    {formatSalary()}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs font-mono ml-auto">
                  <Clock className="h-3.5 w-3.5" />
                  Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="soft-ui-card p-8 space-y-6">
              <h3 className="text-xl font-bold text-charcoal flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Role Overview
              </h3>
              <div className="prose prose-slate max-w-none text-cool-grey whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar (Right) */}
          <div className="space-y-6 lg:sticky lg:top-24 h-max">
            {/* Action Card */}
            <div className="glass-panel p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
              <h4 className="text-sm font-bold text-charcoal uppercase tracking-wider">Ready to connect?</h4>
              <p className="text-sm text-cool-grey">Submit your profile and video pitch securely.</p>
              
              <Button 
                variant={hasApplied ? "secondary" : "default"}
                size="xl"
                className="w-full font-bold uppercase tracking-wide flex items-center justify-center gap-2 rounded-xl"
                onClick={handleApplyClick}
                disabled={hasApplied}
              >
                {hasApplied ? (
                  'Already Applied'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Apply Now
                  </>
                )}
              </Button>
            </div>

            {/* Skills Profile */}
            {job.skills_required && job.skills_required.length > 0 && (
              <div className="soft-ui-card p-6 space-y-4">
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-wider">Requested Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill) => (
                    <Badge key={skill} variant="secondary" className="neo-flat text-xs px-3 py-1.5">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Experience Level Profile */}
            {job.experience_level && (
              <div className="soft-ui-card p-6 space-y-4">
                <h4 className="text-sm font-bold text-charcoal uppercase tracking-wider">Experience Level</h4>
                <Badge variant="outline" className="text-sm px-4 py-2 border-primary/30 text-primary capitalize bg-primary/5">
                  {job.experience_level}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {job && (
        <ApplyJobModal
          isOpen={showApplyModal}
          onClose={() => {
            setShowApplyModal(false);
            if (isDeepLinkedApply) {
              // Strip out the /apply from the URL cleanly after closing
              navigate(`/jobs/${job.id}`, { replace: true });
            }
          }}
          job={job}
        />
      )}
    </DashboardLayout>
  );
}
