import { useState } from 'react';
import { Star, Brain, Calendar, MessageSquare, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NeoCard } from '@/components/ui/neo-card';
import { Textarea } from '@/components/ui/textarea';
import type { AdminVenture } from '@/hooks/useAdminVentures';
import type { HrReview } from '@/hooks/useHrReviews';

interface TalentPipelineCardProps {
  venture: AdminVenture;
  review?: HrReview;
  aiLoading?: boolean;
  onGenerateAi: (ventureId: string) => void;
  onShortlist: (ventureId: string) => void;
  onAddComment: (ventureId: string, comment: string) => void;
  onWatchPitch: (url: string) => void;
  onScheduleInterview: (ventureId: string) => void;
}

export function TalentPipelineCard({
  venture,
  review,
  aiLoading,
  onGenerateAi,
  onShortlist,
  onAddComment,
  onWatchPitch,
  onScheduleInterview,
}: TalentPipelineCardProps) {
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);

  const logicScore = review?.ai_logic_score;
  const scoreColor = logicScore
    ? logicScore >= 7 ? 'text-green-600 bg-green-500/10'
    : logicScore >= 4 ? 'text-amber-600 bg-amber-500/10'
    : 'text-red-600 bg-red-500/10'
    : 'text-muted-foreground bg-muted';

  return (
    <NeoCard className="p-4 lg:p-5 rounded-sm">
      <div className="flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{venture.name}</h3>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {venture.stage}
              </Badge>
              {review?.is_shortlisted && (
                <Badge className="bg-primary/10 text-primary text-[10px]">★ Shortlisted</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {venture.founder_name || 'Unknown'} · {(venture.industry || []).join(', ') || 'N/A'}
            </p>
          </div>

          {/* Logic Score Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-sm font-bold ${scoreColor}`}>
            <Brain className="h-3.5 w-3.5" />
            {logicScore ? `${logicScore}/10` : '—'}
          </div>
        </div>

        {/* AI Summary */}
        {review?.ai_summary && (
          <div className="bg-muted/50 rounded-sm px-3 py-2 border-l-2 border-primary/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">AI TL;DR</p>
            <p className="text-sm text-foreground">{review.ai_summary}</p>
          </div>
        )}

        {/* Comment thread preview */}
        {review?.comment && (
          <div className="bg-muted/30 rounded-sm px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Team Notes</p>
            <p className="text-sm text-foreground">{review.comment}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <Button
            size="sm"
            variant={review?.is_shortlisted ? 'default' : 'outline'}
            className="h-8 text-xs rounded-sm"
            onClick={() => onShortlist(venture.id)}
          >
            <Star className={`h-3.5 w-3.5 mr-1 ${review?.is_shortlisted ? 'fill-current' : ''}`} />
            {review?.is_shortlisted ? 'Shortlisted' : 'Shortlist'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs rounded-sm"
            onClick={() => onGenerateAi(venture.id)}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Brain className="h-3.5 w-3.5 mr-1" />}
            AI Analysis
          </Button>

          {venture.pitch_video_url && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs rounded-sm"
              onClick={() => onWatchPitch(venture.pitch_video_url!)}
            >
              <Play className="h-3.5 w-3.5 mr-1" /> Watch
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs rounded-sm"
            onClick={() => onScheduleInterview(venture.id)}
          >
            <Calendar className="h-3.5 w-3.5 mr-1" /> Interview
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs rounded-sm"
            onClick={() => setShowComment(!showComment)}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" /> Comment
          </Button>
        </div>

        {/* Comment input */}
        {showComment && (
          <div className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note about this candidate..."
              className="text-sm min-h-[60px] rounded-sm"
            />
            <Button
              size="sm"
              className="self-end h-8 rounded-sm"
              disabled={!comment.trim()}
              onClick={() => {
                onAddComment(venture.id, comment.trim());
                setComment('');
                setShowComment(false);
              }}
            >
              Post
            </Button>
          </div>
        )}
      </div>
    </NeoCard>
  );
}
