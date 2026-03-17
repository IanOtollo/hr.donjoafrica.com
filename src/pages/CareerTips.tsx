import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { Lightbulb, Video, FileCheck, Star } from 'lucide-react';

const tips = [
  { icon: Video, title: 'Keep your pitch under 60 seconds', desc: 'HR teams watch hundreds of videos. Be concise and impactful.' },
  { icon: FileCheck, title: 'Tailor each application', desc: 'Reference the specific role and company in your video.' },
  { icon: Star, title: 'Show, don\'t just tell', desc: 'Demonstrate your work with examples or a quick portfolio walkthrough.' },
  { icon: Lightbulb, title: 'Good lighting matters', desc: 'Record in a well-lit space — it shows professionalism.' },
];

export default function CareerTips() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/auth');
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Career Tips</h1>
          <p className="text-cool-grey text-sm">Advice to help your applications stand out</p>
        </div>
        <div className="grid gap-4">
          {tips.map((t) => (
            <NeoCard key={t.title} className="p-5">
              <div className="flex gap-4">
                <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center flex-shrink-0">
                  <t.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">{t.title}</h3>
                  <p className="text-sm text-cool-grey mt-1">{t.desc}</p>
                </div>
              </div>
            </NeoCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
