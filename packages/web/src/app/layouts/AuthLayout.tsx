import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { Zap } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Auth Layout
   Terminal-style centered auth forms
   ═══════════════════════════════════════════════════════════════════════════ */

export function AuthLayout() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-terminal-950 flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center justify-center border-b border-terminal-800">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          <span className="font-mono font-semibold text-terminal-200 tracking-tight">
            SENTRY
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 flex items-center justify-center border-t border-terminal-800">
        <span className="text-xs font-mono text-terminal-500">
          © 2026 SENTRY • Collaborative Decision Intelligence
        </span>
      </footer>
    </div>
  );
}
