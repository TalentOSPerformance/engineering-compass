import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  PanelLeftClose,
  PanelLeft,
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

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 56;

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const showFilters = METRIC_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (pathname.startsWith('/login')) {
    return <>{children}</>;
  }

  return (
    <FilterProvider orgId={orgId}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="hidden flex-shrink-0 border-r border-sidebar-border bg-sidebar-bg lg:block overflow-hidden"
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-3">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent font-bold text-white text-sm hover:brightness-110 transition-all active:scale-95"
              >
                {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
              </button>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="text-base font-semibold tracking-tight text-foreground whitespace-nowrap"
                  >
                    TalentOS
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
              {NAV_SECTIONS.map((section, si) => (
                <div key={si}>
                  {section.title && !collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-1 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60"
                    >
                      {section.title}
                    </motion.p>
                  )}
                  {section.title && collapsed && (
                    <div className="my-2 mx-2 border-t border-border-default/50" />
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
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-muted-foreground/50 font-mono"
                  >
                    v0.2.0
                  </motion.p>
                )}
              </AnimatePresence>
              <ThemeToggle />
            </div>
          </div>
        </motion.aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
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
    <Link
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-150 ${
        isActive
          ? 'bg-nav-active text-foreground font-medium'
          : 'text-muted hover:bg-nav-hover hover:text-foreground'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
        {getIcon(item.icon)}
      </span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
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
