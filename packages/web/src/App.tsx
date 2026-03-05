import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { fetchCurrentUser } from "./store/slices/authSlice";
import { connectSocket } from "./lib/socket";

// Layouts
import { DashboardLayout, AuthLayout } from "./app/layouts";

// Lazy-loaded pages (Code splitting per AGENT_INSTRUCTIONS)
const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const RegisterPage = lazy(() => import("./features/auth/RegisterPage"));
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const ChatPage = lazy(() => import("./features/chat/ui/ChatWindow"));

// Real pages
const ProjectsPage = lazy(() => import("./features/projects/ProjectsPage"));
const DecisionsPage = lazy(() => import("./features/decisions/DecisionsPage"));
const DocumentsPage = lazy(() => import("./features/documents/DocumentsPage"));
const WorkshopPage = lazy(
  () => import("./features/workshop/ui/WorkshopLiveSession"),
);
const ChannelsPage = lazy(() => import("./features/channels/ChannelsPage"));
const ChannelChatWindow = lazy(
  () => import("./features/channels/ChannelChatWindow"),
);
const ActivityFeed = lazy(() => import("./features/feed/ui/ActivityFeed"));
const SettingsPage = lazy(() => import("./features/settings/SettingsPage"));
const UserProfilePage = lazy(() => import("./features/user/ui/UserProfile"));

/* ═══════════════════════════════════════════════════════════════════════════
   Loading Fallback
   ═══════════════════════════════════════════════════════════════════════════ */

function PageLoader() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-terminal-500 font-mono text-sm flex items-center gap-2">
        <span className="animate-pulse">Loading</span>
        <span className="animate-blink">_</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Protected Route Wrapper
   ═══════════════════════════════════════════════════════════════════════════ */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   App Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token && isAuthenticated) {
      dispatch(fetchCurrentUser());
      connectSocket(token);
    }
  }, [token, isAuthenticated, dispatch]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/messages" element={<ChatPage />} />
          <Route path="/messages/:chatId" element={<ChatPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/p/:projectId/*" element={<ProjectsPage />} />
          <Route path="/decisions" element={<DecisionsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:docId" element={<DocumentsPage />} />
          <Route path="/workshops" element={<WorkshopPage />} />
          <Route path="/workshops/:workshopId" element={<WorkshopPage />} />
          <Route path="/channels" element={<ChannelsPage />}>
            <Route path=":channelId" element={<ChannelChatWindow />} />
          </Route>
          <Route path="/feed" element={<ActivityFeed />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
