import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Database,
  FileStack,
  FileText,
  LogOut,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { clearAuthSession } from '../api/auth';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

function isNavActive(currentPath: string, path: string) {
  if (path === '/knowledgebase') return currentPath === '/knowledgebase' || currentPath === '/knowledgebase/upload';
  if (path === '/resume-builder') return currentPath.startsWith('/resume-builder');
  return currentPath.startsWith(path);
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const currentPath = location.pathname;
  const isInterviewRoute = /\/interview\/\d+/.test(currentPath);
  const isFullBleedRoute = currentPath === '/upload' || currentPath.startsWith('/resume-builder');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = useMemo<NavItem[]>(
    () => [
      { id: 'resumes', path: '/history', label: '简历库', icon: FileStack },
      { id: 'resume-builder', path: '/resume-builder', label: '简历生成', icon: FileText },
      { id: 'interviews', path: '/interviews', label: '面试记录', icon: Users },
      { id: 'kb-manage', path: '/knowledgebase', label: '知识库', icon: Database },
      { id: 'chat', path: '/knowledgebase/chat', label: '问答助手', icon: MessageSquare },
    ],
    [],
  );

  if (isInterviewRoute) {
    return <Outlet />;
  }

  return (
    <div className="app-sky-bg relative min-h-screen overflow-x-hidden text-[color:var(--color-app-text)]">
      <div className="app-clouds pointer-events-none fixed inset-0 -z-20" />
      <header className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <motion.nav
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0, scale: scrolled ? 0.97 : 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-auto inline-grid w-auto grid-cols-[auto_auto_auto] items-center rounded-full border border-white/15 bg-white/[0.05] px-2 py-2 backdrop-blur-[20px] transition-shadow duration-300 ${
            scrolled
              ? 'shadow-[0_16px_48px_rgba(30,64,175,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]'
              : 'shadow-[0_10px_30px_rgba(30,64,175,0.2),inset_0_1px_0_rgba(255,255,255,0.14)]'
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 rounded-full bg-black/25 p-1">
            {navItems.slice(0, 3).map(item => {
              const active = isNavActive(currentPath, item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium tracking-wide transition sm:text-sm ${
                    active
                      ? 'bg-[#0b1120] text-white shadow-[0_0_24px_rgba(99,102,241,0.45)]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <Link
            to="/upload"
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/22 bg-[radial-gradient(circle_at_30%_30%,rgba(148,163,255,0.38),rgba(56,189,248,0.2)_38%,rgba(2,6,23,0.85)_100%)] text-white shadow-[0_0_22px_rgba(99,102,241,0.55)] transition hover:scale-105 hover:shadow-[0_0_28px_rgba(56,189,248,0.65)]"
            title="返回首页"
            aria-label="返回首页"
          >
            <Sparkles className="h-5 w-5" strokeWidth={2.1} />
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-start gap-1 rounded-full bg-black/25 p-1">
            {navItems.slice(3).map(item => {
              const active = isNavActive(currentPath, item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`group flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium tracking-wide transition sm:text-sm ${
                    active
                      ? 'bg-[#0b1120] text-white shadow-[0_0_24px_rgba(99,102,241,0.45)]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                navigate('/login', { replace: true });
              }}
              className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:scale-105 hover:border-white/30 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.55)] sm:flex"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.9} />
              退出
            </button>
          </div>
        </motion.nav>
      </header>

      <main className="relative z-10 px-4 pb-10 pt-28 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {isFullBleedRoute ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-[1240px] rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(15,23,42,0.6),0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-[20px] sm:p-8">
              <Outlet />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
