import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Megaphone,
  UserCog,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin?tab=overview' },
  { icon: Briefcase, label: 'CMS (Job Postings)', path: '/employer' },
  { icon: Users, label: 'Talent Management', path: '/admin?tab=pipeline' },
  { icon: UserCog, label: 'User Management', path: '/admin?tab=review' },
  { icon: BarChart3, label: 'Analytics', path: '/admin?tab=analytics' },
  { icon: Megaphone, label: 'Announcements', path: '/admin?tab=overview' },
  { icon: Settings, label: 'Platform Settings', path: '/employer/settings' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
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
          "fixed lg:sticky top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out bg-white/90 backdrop-blur-xl border-r border-border/50 shadow-lg",
          isCollapsed ? "w-20" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Admin Branding */}
        <div className={cn("p-6 flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md">
            <Settings className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-charcoal truncate uppercase tracking-tight">Fuse Admin</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Control Center</p>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="flex justify-end px-4 mb-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1">
          {adminNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path + item.label}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-cool-grey hover:bg-secondary/50 hover:text-charcoal",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-cool-grey")} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-border/30">
          <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-secondary/30", isCollapsed && "flex-col")}>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {profile?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-charcoal truncate">{profile?.username || 'Admin User'}</p>
                <p className="text-[10px] text-cool-grey">Administrator</p>
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
