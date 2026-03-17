import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SmartFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  stageFilter: string;
  onStageChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  scoreFilter: string;
  onScoreChange: (val: string) => void;
  industryTags: string[];
  selectedIndustry: string;
  onIndustryChange: (val: string) => void;
  totalResults: number;
}

export function SmartFilters({
  search, onSearchChange,
  stageFilter, onStageChange,
  statusFilter, onStatusChange,
  scoreFilter, onScoreChange,
  industryTags, selectedIndustry, onIndustryChange,
  totalResults,
}: SmartFiltersProps) {
  const hasFilters = stageFilter !== 'all' || statusFilter !== 'all' || scoreFilter !== 'all' || selectedIndustry !== 'all' || search.trim() !== '';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, skill, or founder..."
            className="pl-9 h-9 rounded-sm text-sm"
          />
        </div>

        <Select value={stageFilter} onValueChange={onStageChange}>
          <SelectTrigger className="w-[130px] h-9 rounded-sm text-sm">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
            <SelectItem value="prototype">Prototype</SelectItem>
            <SelectItem value="mvp">MVP</SelectItem>
            <SelectItem value="growth">Growth</SelectItem>
            <SelectItem value="scale">Scale</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px] h-9 rounded-sm text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={scoreFilter} onValueChange={onScoreChange}>
          <SelectTrigger className="w-[140px] h-9 rounded-sm text-sm">
            <SelectValue placeholder="AI Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Score</SelectItem>
            <SelectItem value="high">High (7-10)</SelectItem>
            <SelectItem value="medium">Medium (4-6)</SelectItem>
            <SelectItem value="low">Low (1-3)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedIndustry} onValueChange={onIndustryChange}>
          <SelectTrigger className="w-[150px] h-9 rounded-sm text-sm">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industryTags.map((tag) => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>{totalResults} candidate{totalResults !== 1 ? 's' : ''}</span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs rounded-sm"
            onClick={() => {
              onSearchChange('');
              onStageChange('all');
              onStatusChange('all');
              onScoreChange('all');
              onIndustryChange('all');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
