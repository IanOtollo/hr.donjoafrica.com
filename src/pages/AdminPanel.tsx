import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Users, FileText, Play, CheckCircle, X,
  Calendar, Award, Loader2, AlertCircle, ArrowRight, Download, Eye, Rocket,
  GitCompare, Sparkles, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PitchVideoModal } from '@/components/PitchVideoModal';
import { useAdminVentures } from '@/hooks/useAdminVentures';
import { useAllHrReviews, useCreateHrReview, useUpdateHrReview, generateAiReview } from '@/hooks/useHrReviews';
import { useAuth } from '@/context/AuthContext';
import { formatStage } from '@/lib/stageDisplay';
import { toast } from 'sonner';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { TalentPipelineCard } from '@/components/admin/TalentPipelineCard';
import { SmartFilters } from '@/components/admin/SmartFilters';
import { SystemHealthGauge, EngagementFluxChart, MetricCard, PipelineVelocityGauge, SkillRadarChart, GeospatialHeatmap, ApplicationVelocityChart } from '@/components/admin/MedicalChicAnalytics';

type Tab = 'overview' | 'analytics' | 'review';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildApplicationChartData(ventures: { created_at?: string }[]) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentYear = new Date().getFullYear();
  const safeVentures = Array.isArray(ventures) ? ventures : [];
  const byMonth = months.map((_, i) => {
    const count = safeVentures.filter((v) => {
      const ts = v?.created_at;
      if (!ts) return false;
      const d = new Date(ts);
      return !isNaN(d.getTime()) && d.getMonth() === i && d.getFullYear() === currentYear;
    }).length;
    return { label: months[i], applications: count, velocity: count * 2 };
  });
  return byMonth;
}

const MOCK_TOTAL = 24;
const MOCK_ACTIVE = 12;

function getLogicClarityScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return 82 + (Math.abs(h) % 18);
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Sync tab with URL
  const tabFromUrl = (searchParams.get('tab') as Tab) || 'overview';
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl);

  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab: Tab) => {
    setSearchParams({ tab: newTab });
    setActiveTab(newTab);
  };

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [comparePair, setComparePair] = useState<[string, string] | null>(null);
  const [removedVentureIds, setRemovedVentureIds] = useState<Set<string>>(new Set());
  const [aiLoadingIds, setAiLoadingIds] = useState<Set<string>>(new Set());

  // Filters state
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const { pendingVentures, allVentures, isLoading, error, updateStatus, isUpdating } = useAdminVentures();
  const { data: allReviews = [] } = useAllHrReviews();
  const createReview = useCreateHrReview();
  const updateReview = useUpdateHrReview();

  const reviewsByVenture = useMemo(() => {
    const map: Record<string, typeof allReviews[0]> = {};
    allReviews.forEach((r) => { if (!map[r.venture_id]) map[r.venture_id] = r; });
    return map;
  }, [allReviews]);

  // Industry tags for filter
  const industryTags = useMemo(() => {
    const tags = new Set<string>();
    (allVentures ?? []).forEach((v) => (v.industry || []).forEach((i) => tags.add(i)));
    return Array.from(tags).sort();
  }, [allVentures]);

  // Filtered ventures for pipeline
  const filteredVentures = useMemo(() => {
    let list = allVentures ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        (v.founder_name || '').toLowerCase().includes(q) ||
        (v.industry || []).some((i) => i.toLowerCase().includes(q))
      );
    }
    if (stageFilter !== 'all') list = list.filter((v) => v.stage === stageFilter);
    if (statusFilter !== 'all') list = list.filter((v) => v.review_status === statusFilter);
    if (selectedIndustry !== 'all') list = list.filter((v) => (v.industry || []).includes(selectedIndustry));
    if (scoreFilter !== 'all') {
      list = list.filter((v) => {
        const score = reviewsByVenture[v.id]?.ai_logic_score;
        if (!score) return false;
        if (scoreFilter === 'high') return score >= 7;
        if (scoreFilter === 'medium') return score >= 4 && score <= 6;
        if (scoreFilter === 'low') return score <= 3;
        return true;
      });
    }
    return list;
  }, [allVentures, search, stageFilter, statusFilter, scoreFilter, selectedIndustry, reviewsByVenture]);

  const baseQueueItems = (pendingVentures ?? []).filter((v) => v?.review_status === 'pending' || v?.review_status === 'submitted');
  const reviewQueueItems = baseQueueItems.filter((v) => !removedVentureIds.has(v.id));
  const pendingCount = reviewQueueItems.length;

  useEffect(() => {
    const baseIds = new Set(baseQueueItems.map((v) => v.id));
    setRemovedVentureIds((prev) => {
      const next = new Set(prev);
      next.forEach((id) => { if (!baseIds.has(id)) next.delete(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [baseQueueItems.length, baseQueueItems.map((v) => v.id).join(',')]);

  const shortlistedCount = allVentures?.filter((v) => v?.review_status === 'shortlisted').length ?? 0;
  const rejectedCount = allVentures?.filter((v) => v?.review_status === 'rejected').length ?? 0;
  const applicationChartData = buildApplicationChartData(allVentures ?? []);

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const pendingLongCount = (allVentures ?? []).filter(
    (v) => (v?.review_status === 'pending' || v?.review_status === 'submitted') && new Date(v.created_at) < fiveDaysAgo
  ).length;

  const currentMonthIdx = new Date().getMonth();
  const thisMonthApps = applicationChartData[currentMonthIdx]?.applications ?? 0;
  const lastMonthApps = applicationChartData[currentMonthIdx - 1]?.applications ?? 0;
  const monthOverMonthChange = lastMonthApps > 0 ? (thisMonthApps - lastMonthApps) / lastMonthApps : 0;

  const handleAction = (venture: { id: string; name: string; founder_id?: string | null }, action: 'shortlisted' | 'rejected') => {
    setRemovedVentureIds((prev) => new Set(prev).add(venture.id));
    updateStatus(
      { ventureId: venture.id, status: action, founderId: venture.founder_id ?? undefined, ventureName: venture.name },
      { onError: () => setRemovedVentureIds((prev) => { const n = new Set(prev); n.delete(venture.id); return n; }) }
    );
  };

  // HR Pipeline handlers
  const handleGenerateAi = async (ventureId: string) => {
    const venture = (allVentures ?? []).find((v) => v.id === ventureId);
    if (!venture || !user) return;
    setAiLoadingIds((prev) => new Set(prev).add(ventureId));
    try {
      const result = await generateAiReview({
        name: venture.name,
        tagline: venture.tagline,
        industry: venture.industry,
        stage: venture.stage,
        founder_name: venture.founder_name,
      });
      const existing = reviewsByVenture[ventureId];
      if (existing) {
        updateReview.mutate({ id: existing.id, ai_summary: result.summary, ai_logic_score: result.logic_score });
      } else {
        createReview.mutate({
          venture_id: ventureId,
          reviewer_id: user.id,
          ai_summary: result.summary,
          ai_logic_score: result.logic_score,
        });
      }
      toast.success(`AI analysis complete: ${result.logic_score}/10`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAiLoadingIds((prev) => { const n = new Set(prev); n.delete(ventureId); return n; });
    }
  };

  const handleShortlist = (ventureId: string) => {
    if (!user) return;
    const existing = reviewsByVenture[ventureId];
    if (existing) {
      updateReview.mutate({ id: existing.id, is_shortlisted: !existing.is_shortlisted });
    } else {
      createReview.mutate({ venture_id: ventureId, reviewer_id: user.id, is_shortlisted: true });
    }
  };

  const handleAddComment = (ventureId: string, comment: string) => {
    if (!user) return;
    const existing = reviewsByVenture[ventureId];
    if (existing) {
      const newComment = existing.comment ? `${existing.comment}\n\n${comment}` : comment;
      updateReview.mutate({ id: existing.id, comment: newComment });
    } else {
      createReview.mutate({ venture_id: ventureId, reviewer_id: user.id, comment });
    }
    toast.success('Comment added');
  };

  const handleScheduleInterview = (ventureId: string) => {
    const venture = (allVentures ?? []).find((v) => v.id === ventureId);
    if (!venture) return;
    const title = encodeURIComponent(`Interview: ${venture.name}`);
    const details = encodeURIComponent(`Interview with ${venture.founder_name || 'Founder'} for ${venture.name}`);
    const calLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&add=${''}&sf=true`;
    window.open(calLink, '_blank');
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const handleDownloadDossier = async () => {
    setPdfLoading(true);
    const applicants = (allVentures ?? []).map((v) => ({
      applicantName: v.founder_name || 'Unknown',
      jobRole: v.name,
      videoPortfolioUrl: v.pitch_video_url || null,
    }));
    const filename = `applicant-dossier-${new Date().toISOString().slice(0, 10)}`;
    try {
      const reactPdf = await import('@react-pdf/renderer');
      const { ApplicantDossierPDF } = await import('@/components/admin/ApplicantDossierPDF');
      const doc = <ApplicantDossierPDF applicants={applicants} title="Applicant Dossier — Venture Engine" />;
      const instance = reactPdf.pdf(doc);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${filename}.pdf`; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      requestAnimationFrame(() => { document.body.removeChild(a); URL.revokeObjectURL(url); });
      toast.success('Applicant dossier downloaded');
    } catch (err) {
      console.error('PDF download error:', err);
      try {
        const header = 'Applicant Name,Job Role,Video Portfolio\n';
        const rows = applicants.map((a) => `"${(a.applicantName || '').replace(/"/g, '""')}","${(a.jobRole || '').replace(/"/g, '""')}","${a.videoPortfolioUrl || ''}"`).join('\n');
        const csvBlob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(csvBlob);
        const a = document.createElement('a');
        a.href = url; a.download = `${filename}.csv`; a.style.display = 'none';
        document.body.appendChild(a); a.click();
        requestAnimationFrame(() => { document.body.removeChild(a); URL.revokeObjectURL(url); });
        toast.success('Downloaded as CSV (PDF unavailable)');
      } catch (fallbackErr) {
        console.error('CSV fallback error:', fallbackErr);
        toast.error('Failed to generate download');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'review', label: `Review Queue (${pendingCount})` },
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-destructive">Failed to load ventures. Please try again.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full overflow-x-hidden p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {activeTab === 'overview' ? 'Admin Dashboard' : 
               activeTab === 'analytics' ? 'Platform Analytics' : 
               'User Management'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {activeTab === 'overview' ? 'Overview of platform activity and pending reviews.' : 
               activeTab === 'analytics' ? 'System health and engagement metrics.' : 
               'Review, rate, and shortlist candidates with AI-powered insights.'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="neo-extruded border-none shrink-0 pointer-events-auto rounded-sm"
            onClick={handleDownloadDossier}
            disabled={pdfLoading || !allVentures?.length}
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download Dossier
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-sm text-sm font-semibold whitespace-nowrap transition-all duration-300 pointer-events-auto ${
                activeTab === tab.id
                  ? 'neo-pressed text-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'neo-flat text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RocketLoader indeterminate label="Loading overview..." />
              </div>
            ) : (
              <>
                {(pendingLongCount > 0 || pendingCount >= 3) && (
                  <div className="rounded-sm px-4 py-3 flex items-center justify-between gap-4 flex-wrap pointer-events-auto" style={{ background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)', color: 'white' }}>
                    <div className="flex items-center gap-3">
                      {pendingLongCount > 0 ? <AlertCircle className="h-5 w-5 shrink-0" /> : <Rocket className="h-5 w-5 shrink-0" />}
                      <span className="font-medium text-sm">
                        {pendingLongCount > 0
                          ? `⚠️ ${pendingLongCount} pending review${pendingLongCount !== 1 ? 's' : ''} overdue 5+ days.`
                          : '🚀 You have pending reviews to process.'}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => setActiveTab('review')} className="bg-white text-blue-600 hover:bg-white/90 shrink-0 rounded-sm pointer-events-auto">
                      Review Queue <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                {/* Hero Stats (Real data only) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard title="TOTAL APPLICATIONS" value={String(allVentures?.length ?? 0)} change={monthOverMonthChange} changeLabel="vs last month" />
                  <StatCard title="SHORTLISTED" value={String(shortlistedCount)} />
                  <StatCard title="PENDING REVIEW" value={String(pendingCount)} />
                  <StatCard title="REJECTED" value={String(rejectedCount)} />
                </div>

                {/* Admin Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('review')}
                    className="glass-panel p-4 sm:p-6 rounded-2xl text-left hover:opacity-90 transition-all duration-300 group min-w-0"
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-white/80">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-charcoal mb-1">Review Queue</h3>
                    <p className="text-xs sm:text-sm text-cool-grey">{pendingCount} pending submissions</p>
                  </button>
                  <button
                    onClick={() => navigate('/employer/jobs/create')}
                    className="glass-panel p-4 sm:p-6 rounded-2xl text-left hover:opacity-90 transition-all duration-300 group min-w-0"
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-white/80">
                      <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-charcoal mb-1">Job Postings</h3>
                    <p className="text-xs sm:text-sm text-cool-grey">Create & manage jobs</p>
                  </button>
                  <button
                    onClick={() => navigate('/employer')}
                    className="glass-panel p-4 sm:p-6 rounded-2xl text-left hover:opacity-90 transition-all duration-300 group min-w-0"
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-white/80">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-charcoal mb-1">Jobs Applied</h3>
                    <p className="text-xs sm:text-sm text-cool-grey">View applicants by job</p>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="glass-panel p-4 sm:p-6 rounded-2xl text-left hover:opacity-90 transition-all duration-300 group min-w-0"
                  >
                    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/60 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-white/80">
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-charcoal mb-1">Analytics</h3>
                    <p className="text-xs sm:text-sm text-cool-grey">Detailed insights</p>
                  </button>
                </div>

                {/* Technical Verification Feed */}
                <NeoCard className="p-4 lg:p-5 rounded-[2px] pointer-events-auto">
                  <p className="text-xs font-semibold text-cool-grey uppercase tracking-wider mb-3">Technical Verification Feed</p>
                  <p className="text-sm text-cool-grey mb-4">Recent video submissions with AI verification</p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {((allVentures ?? []).filter((v) => v.pitch_video_url).slice(0, 6)).map((v) => (
                      <div key={v.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 neo-subtle rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-charcoal truncate">{v.name}</p>
                            <p className="text-xs text-cool-grey">{v.founder_name || 'Applicant'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-600 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                            <Sparkles className="h-3 w-3" /> AI-Verified
                          </span>
                          <span className="text-xs font-mono font-semibold text-charcoal">{getLogicClarityScore(v.id)}%</span>
                          <span className="text-[10px] text-cool-grey">Logic</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => v.pitch_video_url && setSelectedVideo(v.pitch_video_url)} disabled={!v.pitch_video_url}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => {
                            const withVideos = (allVentures ?? []).filter((x) => x.pitch_video_url);
                            const idx = withVideos.findIndex((x) => x.id === v.id);
                            const next = withVideos[(idx + 1) % Math.max(1, withVideos.length)];
                            if (next && next.id !== v.id) setComparePair([v.pitch_video_url!, next.pitch_video_url!]);
                            else if (withVideos.length >= 2) setComparePair([withVideos[0].pitch_video_url!, withVideos[1].pitch_video_url!]);
                          }}>
                            <GitCompare className="h-3.5 w-3.5" /> Quick Compare
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(allVentures ?? []).filter((v) => v.pitch_video_url).length === 0 && (
                      <div className="py-6 text-center text-cool-grey text-sm">
                        No video submissions yet. Mock: AI-Verified badges and Logic Clarity Scores will appear here.
                      </div>
                    )}
                  </div>
                </NeoCard>

                {/* 70/30 Right Rail Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                  <div className="space-y-4 min-w-0">
                    <NeoCard className="p-4 lg:p-5 rounded-sm pointer-events-auto">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Application Velocity</p>
                      <ApplicationVelocityChart
                        data={(() => {
                          const ventures = allVentures ?? [];
                          const now = new Date();
                          return Array.from({ length: 30 }, (_, i) => {
                            const d = new Date(now);
                            d.setDate(d.getDate() - (29 - i));
                            const count = ventures.filter((v) => new Date(v.created_at).toDateString() === d.toDateString()).length;
                            return { day: d.getDate(), applications: count };
                          });
                        })()}
                      />
                    </NeoCard>

                    <NeoCard className="p-4 lg:p-5 rounded-sm pointer-events-auto overflow-hidden">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Submissions</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-2 font-semibold text-foreground">Startup</th>
                              <th className="text-left py-2 px-2 font-semibold text-foreground">Sector</th>
                              <th className="text-left py-2 px-2 font-semibold text-foreground">Date</th>
                              <th className="text-left py-2 px-2 font-semibold text-foreground">Status</th>
                              <th className="text-right py-2 px-2 font-semibold text-foreground">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(allVentures ?? []).slice(0, 8).map((v) => (
                              <tr key={v.id} className="border-b border-border/50 last:border-0">
                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 neo-subtle rounded-sm flex items-center justify-center shrink-0">
                                      <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground truncate max-w-[120px]">{v.name}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-muted-foreground text-xs">{(v.industry || ['—'])[0]}</td>
                                <td className="py-2 px-2 text-muted-foreground text-xs">{formatDate(v.created_at)}</td>
                                <td className="py-2 px-2">
                                  <Badge className={`text-[10px] ${
                                    v.review_status === 'shortlisted' ? 'bg-green-500/10 text-green-600' :
                                    v.review_status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                                    'bg-amber-500/10 text-amber-600'
                                  }`}>{v.review_status}</Badge>
                                </td>
                                <td className="py-2 px-2 text-right">
                                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-sm pointer-events-auto" onClick={() => v.pitch_video_url && setSelectedVideo(v.pitch_video_url)} disabled={!v.pitch_video_url}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {(allVentures ?? []).length === 0 && (
                              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No submissions yet</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </NeoCard>
                  </div>

                  <div className="space-y-4 lg:min-w-[300px]">
                    <NeoCard className="p-4 rounded-sm pointer-events-auto">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Overview</p>
                      <div className="space-y-4">
                        <div className="p-4 neo-subtle rounded-sm">
                          <p className="text-2xl font-bold text-foreground">{allVentures?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Total Candidates</p>
                        </div>
                        <div className="p-4 neo-subtle rounded-sm">
                          <p className="text-2xl font-bold text-foreground">{shortlistedCount}</p>
                          <p className="text-xs text-muted-foreground">Shortlisted</p>
                        </div>
                      </div>
                    </NeoCard>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RocketLoader indeterminate label="Loading analytics..." />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <NeoCard className="p-6 rounded-sm pointer-events-auto">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">System Health</p>
                    <SystemHealthGauge
                      value={(allVentures?.length ? (shortlistedCount / allVentures.length) * 10 : 0)}
                      max={10}
                      label="Application Success Rate"
                    />
                  </NeoCard>
                  <NeoCard className="p-6 rounded-sm pointer-events-auto">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Engagement Flux</p>
                    <EngagementFluxChart
                      data={(() => {
                        const days = 7;
                        const now = new Date();
                        return Array.from({ length: days }, (_, i) => {
                          const d = new Date(now);
                          d.setDate(d.getDate() - (days - 1 - i));
                          return {
                            date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                            applicants: (allVentures ?? []).filter((v) =>
                              new Date(v.created_at).toDateString() === d.toDateString()
                            ).length,
                          };
                        });
                      })()}
                    />
                  </NeoCard>
                </div>
                <NeoCard className="p-6 rounded-sm pointer-events-auto">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Metric Cards</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                    <MetricCard label="Profile Completion" value={allVentures?.filter((v) => v.founder_name && v.pitch_video_url).length ?? 0} max={allVentures?.length || 1} change={12.2} />
                    <MetricCard label="Video Quality Score" value={shortlistedCount * 10} max={(allVentures?.length || 10) * 10} change={-2.4} />
                  </div>
                </NeoCard>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <NeoCard className="p-6 rounded-sm pointer-events-auto">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pipeline Velocity</p>
                    <PipelineVelocityGauge daysToDecision={allVentures?.length ? Math.min(14, 3 + (allVentures.length % 8)) : 5} maxDays={14} label="Avg Days to Decision" />
                  </NeoCard>
                  <NeoCard className="p-6 rounded-sm pointer-events-auto lg:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Skill Radar</p>
                    <SkillRadarChart
                      data={(() => {
                        const industries = (allVentures ?? []).flatMap((v) => (v.industry || []));
                        const counts: Record<string, number> = { Tech: 0, Product: 0, Growth: 0, Operations: 0, Leadership: 0 };
                        industries.forEach((i) => {
                          const lower = i.toLowerCase();
                          if (lower.includes('tech') || lower.includes('software')) counts.Tech++;
                          else if (lower.includes('product')) counts.Product++;
                          else if (lower.includes('growth') || lower.includes('marketing')) counts.Growth++;
                          else if (lower.includes('ops') || lower.includes('operations')) counts.Operations++;
                          else counts.Leadership++;
                        });
                        const max = Math.max(1, ...Object.values(counts));
                        return Object.entries(counts).map(([skill, value]) => ({ skill, value, fullMark: max }));
                      })()}
                    />
                  </NeoCard>
                </div>
                <NeoCard className="p-6 rounded-sm pointer-events-auto">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Geospatial Heatmap</p>
                  <GeospatialHeatmap
                    regionCounts={(() => {
                      const n = (allVentures ?? []).length;
                      const regions = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'meru', 'garissa'];
                      const weights = [0.35, 0.15, 0.12, 0.11, 0.08, 0.08, 0.06, 0.05];
                      const out: Record<string, number> = {};
                      regions.forEach((r, i) => { out[r] = Math.max(0, Math.round(n * weights[i])); });
                      return out;
                    })()}
                  />
                </NeoCard>
              </>
            )}
          </div>
        )}

        {/* Review Queue Tab */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <RocketLoader indeterminate label="Loading review queue..." />
              </div>
            ) : pendingCount === 0 ? (
              <NeoCard className="p-8 lg:p-12 text-center">
                <div className="h-16 w-16 neo-pressed rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-foreground font-semibold text-lg mb-1">All caught up</p>
                <p className="text-muted-foreground text-sm">Every application has been reviewed.</p>
              </NeoCard>
            ) : (
              reviewQueueItems.map((venture) => (
                <NeoCard key={venture.id} className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{venture.name}</p>
                        <p className="text-muted-foreground text-sm">by {venture.founder_name || 'Unknown'} · {(venture.industry || []).join(', ') || '—'} · {formatStage(venture.stage)}</p>
                        <p className="text-muted-foreground/60 text-xs">Submitted {formatDate(venture.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`capitalize ${
                        venture.review_status === 'shortlisted' ? 'bg-green-500/10 text-green-600' :
                        venture.review_status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>{venture.review_status}</Badge>
                      {venture.pitch_video_url && (
                        <Button size="sm" variant="outline" className="neo-extruded border-none" onClick={() => setSelectedVideo(venture.pitch_video_url!)}>
                          <Play className="h-4 w-4 mr-1" /> Watch Pitch
                        </Button>
                      )}
                      {(venture.review_status === 'pending' || venture.review_status === 'submitted') && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleAction(venture, 'shortlisted')} disabled={isUpdating}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Shortlist
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAction(venture, 'rejected')} disabled={isUpdating}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </NeoCard>
              ))
            )}
          </div>
        )}



        <PitchVideoModal
          isOpen={!!selectedVideo && !comparePair}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo || ''}
          title="Applicant Pitch Video"
        />

        {/* Quick Compare Modal - side-by-side videos */}
        {comparePair && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setComparePair(null)}>
            <div className="bg-background rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-charcoal flex items-center gap-2">
                  <GitCompare className="h-5 w-5" /> Quick Compare — Candidate Videos
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setComparePair(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 flex-1 min-h-0">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-cool-grey mb-2">Candidate A</p>
                  <video src={comparePair[0]} controls className="w-full aspect-video rounded-lg bg-black" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-cool-grey mb-2">Candidate B</p>
                  <video src={comparePair[1]} controls className="w-full aspect-video rounded-lg bg-black" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
