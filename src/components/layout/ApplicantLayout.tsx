import { ReactNode, useEffect } from 'react';
import { ApplicantSidebar } from './ApplicantSidebar';
import { DashboardTopBar } from './DashboardTopBar';
import { BottomNav } from './BottomNav';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

interface ApplicantLayoutProps {
  children: ReactNode;
}

export function ApplicantLayout({ children }: ApplicantLayoutProps) {
  const { isCollapsed } = useSidebar();
  
  // Theme sync: ensure light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen min-h-dvh flex relative overflow-x-hidden w-full max-w-full bg-[#FCFCFC]">
      {/* Specialized Applicant Sidebar */}
      <ApplicantSidebar />
      
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Top Bar for Applicant */}
        <DashboardTopBar />
        
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 safe-area-pb overflow-x-hidden w-full max-w-full">
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
