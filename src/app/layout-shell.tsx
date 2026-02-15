'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { FilterProvider } from '../components/filters/filter-context';
import { GlobalFilters } from '../components/filters/global-filters';
import { ThemeToggle } from '../components/theme-toggle';
import {
  Home,
  Rocket,
  Bot,
  BarChart3,
  Users,
  Sparkles,
  Brain,
  Search,
  User,
  Plug,
  HelpCircle,
  Settings,
  Activity,
} from 'lucide-react';

// Pages that show global filters
const METRIC_PAGES = ['/', '/metrics', '/flow', '/metrics/delivery', '/metrics/activity', '/metrics/ai-tools', '/insights-dashboard', '/mentoring', '/surveys', '/teams'];

interface NavSection {
  title?: string;
  items: NavItemDef[];
}

interface NavItemDef {
  href: string;
  label: string;
  icon: string;
  children?: NavItemDef[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/', label: 'Home', icon: 'home' },
    ],
  },
  {
    title: 'Metrics',
    items: [
      { href: '/metrics/delivery', label: 'Delivery', icon: 'truck' },
      { href: '/metrics/activity', label: 'Activity', icon: 'activity' },
      { href: '/metrics/ai-tools', label: 'AI Tools', icon: 'cpu' },
      { href: '/metrics/jira', label: 'Jira', icon: 'chart' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { href: '/teams', label: 'Teams', icon: 'chart' },
      { href: '/team', label: 'People', icon: 'users' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/insights-dashboard', label: 'Insights Dashboard', icon: 'sparkle' },
      { href: '/insights', label: 'AI Insights', icon: 'sparkle' },
      { href: '/proficiency', label: 'Skill Proficiency', icon: 'brain' },
      { href: '/marketplace', label: 'Marketplace', icon: 'search' },
      { href: '/mentoring', label: 'Mentoria', icon: 'users' },
      { href: '/surveys', label: 'Pesquisas', icon: 'chart' },
      { href: '/career-paths', label: 'Carreira', icon: 'chart' },
    ],
  },
  {
    title: 'Pessoal',
    items: [
      { href: '/me', label: 'Minha Area', icon: 'user' },
    ],
  },
  {
    items: [
      { href: '/integrations', label: 'Integrations', icon: 'plug' },
      { href: '/help', label: 'FAQ e Guias', icon: 'help' },
      { href: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { effectiveOrganizationId: orgId } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const showFilters = METRIC_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  // Don't show sidebar/filters on login
  if (pathname.startsWith('/login')) {
    return <>{children}</>;
  }

  return (
    <FilterProvider orgId={orgId}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`hidden flex-shrink-0 border-r border-sidebar-border bg-sidebar-bg transition-[width] duration-200 lg:block ${
            collapsed ? 'w-16' : 'w-60'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-sm hover:bg-blue-500 transition-colors"
              >
                T
              </button>
              {!collapsed && (
                <span className="text-base font-semibold tracking-tight text-foreground">
                  TalentOS
                </span>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
              {NAV_SECTIONS.map((section, si) => (
                <div key={si}>
                  {section.title && !collapsed && (
                    <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {section.title}
                    </p>
                  )}
                  {section.title && collapsed && (
                    <div className="my-2 border-t border-border-default" />
                  )}
                  {section.items.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-border-default p-3 flex items-center justify-between">
              {!collapsed && (
                <p className="text-[10px] text-muted-foreground">v0.2.0</p>
              )}
              <ThemeToggle />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar with filters */}
          {showFilters && (
            <header className="flex h-14 items-center gap-4 border-b border-border-default bg-surface px-6">
              <GlobalFilters />
            </header>
          )}

          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-[1400px] px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}

function SidebarNavItem({
  item,
  pathname,
  collapsed,
}: {
  item: NavItemDef;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    item.href === '/'
      ? pathname === '/'
      : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <a
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-nav-active text-foreground font-medium'
          : 'text-muted hover:bg-nav-hover hover:text-foreground'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center opacity-70">
        {getIcon(item.icon)}
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </a>
  );
}

function getIcon(name: string): React.ReactNode {
  const size = 18;
  const icons: Record<string, React.ReactNode> = {
    home: <Home size={size} />,
    truck: <Rocket size={size} />,
    cpu: <Bot size={size} />,
    users: <Users size={size} />,
    sparkle: <Sparkles size={size} />,
    brain: <Brain size={size} />,
    search: <Search size={size} />,
    user: <User size={size} />,
    plug: <Plug size={size} />,
    help: <HelpCircle size={size} />,
    settings: <Settings size={size} />,
    chart: <BarChart3 size={size} />,
    activity: <Activity size={size} />,
  };
  return icons[name] || <span>•</span>;
}
