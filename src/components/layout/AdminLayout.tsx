import { ReactNode, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { DashboardTopBar } from './DashboardTopBar';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isCollapsed } = useSidebar();
  
  // Theme sync: ensure light theme for corporate feel
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen min-h-dvh flex relative overflow-x-hidden w-full max-w-full bg-[#FAFAFA]">
      {/* Specialized Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0 overflow-x-hidden",
        isCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Top Bar for Admin */}
        <DashboardTopBar />
        
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 pb-8 safe-area-pb overflow-x-hidden w-full max-w-full">
          <div className="animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
