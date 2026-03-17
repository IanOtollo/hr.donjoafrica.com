import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Users, FileText, Play, CheckCircle, X,
  Calendar, Award, Loader2, AlertCircle, ArrowRight, Download, Eye, Rocket
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
import { SystemHealthGauge, EngagementFluxChart, MetricCard, PipelineVelocityGauge, SkillRadarChart, GeospatialHeatmap, ApplicationVelocityChart, CohortCompositionDonut } from '@/components/admin/MedicalChicAnalytics';

const mentors = [
  { id: '1', name: 'Dr. Sarah Kimani', specialty: 'Strategy', available: true },
  { id: '2', name: 'James Ochieng', specialty: 'Engineering', available: true },
  { id: '3', name: 'Aisha Mohamed', specialty: 'Product', available: false },
];

type Tab = 'overview' | 'pipeline' | 'analytics' | 'review' | 'mentors' | 'cohorts';

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

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
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
    { id: 'pipeline', label: 'Talent Pipeline' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'review', label: `Review Queue (${pendingCount})` },
    { id: 'mentors', label: 'Mentors' },
    { id: 'cohorts', label: 'Cohorts' },
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
      <div className="space-y-6 max-w-[1400px] mx-auto w-full overflow-x-hidden px-1 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">Talent Pipeline</h1>
            <p className="text-muted-foreground text-sm">Review, rate, and shortlist candidates with AI-powered insights.</p>
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
              onClick={() => setActiveTab(tab.id)}
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

        {/* ============ TALENT PIPELINE TAB ============ */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <SmartFilters
              search={search}
              onSearchChange={setSearch}
              stageFilter={stageFilter}
              onStageChange={setStageFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              scoreFilter={scoreFilter}
              onScoreChange={setScoreFilter}
              industryTags={industryTags}
              selectedIndustry={selectedIndustry}
              onIndustryChange={setSelectedIndustry}
              totalResults={filteredVentures.length}
            />

            {isLoading ? (
              <div className="flex justify-center py-16">
                <RocketLoader indeterminate label="Loading pipeline..." />
              </div>
            ) : filteredVentures.length === 0 ? (
              <NeoCard className="p-8 text-center">
                <p className="text-muted-foreground">No candidates match your filters.</p>
              </NeoCard>
            ) : (
              <div className="space-y-3">
                {filteredVentures.map((venture) => (
                  <TalentPipelineCard
                    key={venture.id}
                    venture={venture}
                    review={reviewsByVenture[venture.id]}
                    aiLoading={aiLoadingIds.has(venture.id)}
                    onGenerateAi={handleGenerateAi}
                    onShortlist={handleShortlist}
                    onAddComment={handleAddComment}
                    onWatchPitch={(url) => setSelectedVideo(url)}
                    onScheduleInterview={handleScheduleInterview}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-4 max-w-[1400px] mx-auto">
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
                    <Button size="sm" onClick={() => setActiveTab('pipeline')} className="bg-white text-blue-600 hover:bg-white/90 shrink-0 rounded-sm pointer-events-auto">
                      Open Pipeline <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard title="PENDING REVIEW" value={String(pendingCount)} />
                  <StatCard title="TOTAL APPLICATIONS" value={String(allVentures?.length ?? 0)} change={monthOverMonthChange} changeLabel="vs last month" />
                  <StatCard title="SHORTLISTED" value={String(shortlistedCount)} />
                  <StatCard title="REJECTED" value={String(rejectedCount)} />
                </div>

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
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cohort Composition</p>
                      <CohortCompositionDonut
                        data={(() => {
                          const ventures = allVentures ?? [];
                          const counts: Record<string, number> = { Fintech: 0, AgriTech: 0, Health: 0, EdTech: 0, Other: 0 };
                          ventures.forEach((v) => {
                            const ind = (v.industry || [])[0]?.toLowerCase() || '';
                            if (ind.includes('fin') || ind.includes('pay') || ind.includes('bank')) counts.Fintech++;
                            else if (ind.includes('agri') || ind.includes('farm') || ind.includes('food')) counts.AgriTech++;
                            else if (ind.includes('health') || ind.includes('med')) counts.Health++;
                            else if (ind.includes('edu') || ind.includes('learn')) counts.EdTech++;
                            else counts.Other++;
                          });
                          return Object.entries(counts).filter(([, n]) => n > 0).map(([name, value]) => ({ name, value }));
                        })()}
                      />
                    </NeoCard>

                    <NeoCard className="p-4 rounded-sm pointer-events-auto">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mentor Activity</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {mentors.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                            <div className="h-8 w-8 neo-subtle rounded-sm flex items-center justify-center shrink-0">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                              <p className="text-[10px] text-muted-foreground">Reviewed 2 ventures this week</p>
                            </div>
                            <Badge className={m.available ? 'bg-green-500/10 text-green-600 text-[10px]' : 'bg-red-500/10 text-red-600 text-[10px]'}>{m.available ? 'Active' : 'Busy'}</Badge>
                          </div>
                        ))}
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
                    <MetricCard label="Profile Completion" value={allVentures?.filter((v) => v.founder_name && v.pitch_video_url).length ?? 0} max={allVentures?.length ?? 1} change={12.2} />
                    <MetricCard label="Video Quality Score" value={shortlistedCount * 10} max={(allVentures?.length ?? 0) * 10 || 100} change={-2.4} />
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

        {/* Mentors Tab */}
        {activeTab === 'mentors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map(m => (
              <NeoCard key={m.id} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{m.name}</p>
                    <p className="text-muted-foreground text-sm">{m.specialty}</p>
                  </div>
                </div>
                <Badge className={m.available ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
                  {m.available ? 'Available' : 'Busy'}
                </Badge>
              </NeoCard>
            ))}
          </div>
        )}

        {/* Cohorts Tab */}
        {activeTab === 'cohorts' && (
          <div className="space-y-4">
            <NeoCard className="p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 neo-pressed rounded-2xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">Cohort 3 — 2026</p>
                  <p className="text-muted-foreground text-sm">Active · {shortlistedCount} ventures · Demo Day: March 15</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="neo-subtle rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{shortlistedCount}</p>
                  <p className="text-xs text-muted-foreground">Ventures</p>
                </div>
                <div className="neo-subtle rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">8</p>
                  <p className="text-xs text-muted-foreground">Mentors</p>
                </div>
                <div className="neo-subtle rounded-2xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">35d</p>
                  <p className="text-xs text-muted-foreground">To Demo Day</p>
                </div>
              </div>
            </NeoCard>
          </div>
        )}

        <PitchVideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo || ''}
          title="Applicant Pitch Video"
        />
      </div>
    </DashboardLayout>
  );
}
