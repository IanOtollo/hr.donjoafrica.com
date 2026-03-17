import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { BookOpen, Video, FileText, ExternalLink, Rocket } from 'lucide-react';

const resources = [
  { icon: BookOpen, title: 'Pitch Deck Guide', desc: 'How to create a winning pitch deck', link: '#', tag: 'Guide' },
  { icon: Video, title: 'Video Pitch Tips', desc: 'Best practices for 60-second pitches', link: '#', tag: 'Video' },
  { icon: FileText, title: 'Application Checklist', desc: 'Ensure your application stands out', link: '#', tag: 'Checklist' },
  { icon: Rocket, title: 'Startup Resources', desc: 'Templates, tools, and frameworks', link: '#', tag: 'Tools' },
];

export default function Resources() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/auth');
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Resources</h1>
          <p className="text-cool-grey text-sm">Guides, tips, and tools to help you succeed</p>
        </div>
        <div className="grid gap-4">
          {resources.map((r) => (
            <NeoCard key={r.title} className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">{r.tag}</span>
                <h3 className="font-semibold text-charcoal mt-0.5">{r.title}</h3>
                <p className="text-sm text-cool-grey">{r.desc}</p>
              </div>
              <ExternalLink className="h-5 w-5 text-cool-grey flex-shrink-0" />
            </NeoCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
