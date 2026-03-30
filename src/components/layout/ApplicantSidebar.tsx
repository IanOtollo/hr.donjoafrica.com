import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  LayoutDashboard,
  Briefcase,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Trophy,
  Bell
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const applicantNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/feed' },
  { icon: User, label: 'My Portfolio', path: '/profile' },
  { icon: Bookmark, label: 'Application Status', path: '/applicant' },
  { icon: Briefcase, label: 'Find Jobs', path: '/jobs' },
  { icon: Trophy, label: 'Challenges', path: '/challenges' },
];

export function ApplicantSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout, user } = useAuth();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setMobileOpen } = useSidebar();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-xl border-r border-border/50 shadow-sm",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className={cn("p-6 flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-charcoal truncate">Fuse</h1>
              <p className="text-[10px] text-cool-grey font-medium uppercase tracking-wider">Applicant Hub</p>
            </div>
          )}
        </div>

        <div className="flex justify-end px-4 mb-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {applicantNavItems.map((item) => {
             const active = isActive(item.path);
             return (
               <button
                 key={item.path + item.label}
                 onClick={() => navigate(item.path)}
                 className={cn(
                   "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                   active
                     ? "bg-primary text-white shadow-md shadow-primary/20"
                     : "text-cool-grey hover:bg-secondary/50",
                   isCollapsed && "justify-center px-2"
                 )}
               >
                 <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-cool-grey")} />
                 {!isCollapsed && <span className="truncate">{item.label}</span>}
               </button>
             );
          })}
        </nav>

        <div className="p-4 border-t border-border/30">
          <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-secondary/20", isCollapsed && "flex-col")}>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 text-[#1e293b]">
                <p className="text-xs font-semibold truncate">
                  {profile?.username || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[10px] text-cool-grey capitalize">Candidate Account</p>
              </div>
            )}
            <button 
              onClick={() => logout()}
              className="text-cool-grey hover:text-destructive transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
