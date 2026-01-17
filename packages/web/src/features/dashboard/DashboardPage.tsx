'use client';

import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  useGetChatsQuery,
  useGetProjectsQuery,
  useGetDecisionsQuery,
  useGetWorkshopsQuery,
  useGetDocumentsQuery
} from '../../shared/api/apiSlice';
import * as React from 'react';
import { cn } from '../../shared/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { 
  GitPullRequest, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Users,
  Scale,
  Zap,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   BENTO DASHBOARD
   The "Grand Unified" command center combining all SENTRY personalities
   - The Brain (Notion): Docs/Workshops
   - The Pulse (Twitter): Activity Feed  
   - The Nervous System (Slack): Chat
   - The Muscle (GitHub): Decisions/Projects
   ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);

  // Fetch real data
  const { data: projectsData = [] } = useGetProjectsQuery();
  // Assume first project is active context for dashboard overview
  const activeProjectId = projectsData[0]?.id || '';

  const { data: chatsData = [] } = useGetChatsQuery();
  const { data: decisionsData = [] } = useGetDecisionsQuery(activeProjectId, { skip: !activeProjectId });
  const { data: workshopsData = [] } = useGetWorkshopsQuery({ projectId: activeProjectId }, { skip: !activeProjectId });
  const { data: documentsData = [] } = useGetDocumentsQuery({ projectId: activeProjectId }, { skip: !activeProjectId });

  // Fallback Mock Data (for pitch reliability if backend is empty/down)
  const mockChats = [
    { name: 'Sarah (CTO)', message: 'The new Neon DB migration plan looks solid. Did you see my comments on the RFC?', online: true, time: '2m' },
    { name: 'Mike (Product)', message: 'Investors are asking for the Q3 roadmap. Can we workshop it in 15?', online: true, time: '10m' },
    { name: 'Engineering', message: 'Deployment to production successful. v4.2.0 is live.', online: false, time: '1h' },
  ];

  const mockDecisions = [
    { id: 'DEC-103', title: 'Migrate Primary DB to Neon Serverless', status: 'URGENT', votes: 2, total: 5 },
    { id: 'DEC-102', title: 'Adopt RTK Query for API Layer', status: 'PENDING', votes: 4, total: 5 },
  ];

  const mockDocuments = [
    { name: 'Series_A_Pitch_Deck.md', edited: '1h ago', tag: 'DRAFT' },
    { name: 'Architecture_RFC_v2.md', edited: '3h ago', tag: 'REVIEW' },
    { name: 'Q3_Financial_Projections.md', edited: '5h ago', tag: 'FINAL' },
    { name: 'Team_Onboarding_Guide.md', edited: '1d ago', tag: 'WIKI' },
  ];

  // Transform Data or Use Mocks
  const displayChats = chatsData.length > 0 ? chatsData.map(c => ({
    name: c.name || 'Unknown',
    message: 'Active discussion...', // API doesn't return last message in list yet, simplified
    online: true,
    time: formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })
  })) : mockChats;

  const displayDecisions = decisionsData.length > 0 ? decisionsData.map(d => ({
    id: d.id.substring(0, 8).toUpperCase(),
    title: d.statement,
    status: d.deprecated ? 'DEPRECATED' : 'ACTIVE',
    votes: d.votes?.length || 0,
    total: 5 // Mock total
  })) : mockDecisions;

  const displayDocs = documentsData.length > 0 ? documentsData.map(d => ({
    name: d.title,
    edited: formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true }),
    tag: d.docType.toUpperCase()
  })) : mockDocuments;

  const projectCount = projectsData.length > 0 ? projectsData.length : 3; // Mock 3 if empty
  const decisionCount = decisionsData.length > 0 ? decisionsData.length : 12; // Mock 12
  const docCount = documentsData.length > 0 ? documentsData.length : 24; // Mock 24
  const workshopCount = workshopsData.length > 0 ? workshopsData.length : 8; // Mock 8

  // Get time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="h-full overflow-y-auto bg-terminal-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER: Personalized Greeting + Activity Sparkline
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-between items-end border-b border-terminal-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-terminal-100 tracking-tight font-sans">
              {greeting}, {user?.displayName || user?.handle || 'Commander'}.
            </h1>
            <p className="text-terminal-400 mt-2 font-light">
              System operating at <span className="text-success font-medium">98.4% efficiency</span>. You have <span className="text-warning font-medium">{decisionCount > 0 ? 3 : 0} decisions</span> pending review.
            </p>
          </div>
          
          {/* Mini Activity Graph */}
          <div className="flex gap-1 items-end h-10">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 rounded-sm bg-accent"
                style={{
                  height: `${20 + Math.random() * 80}%`,
                  opacity: 0.2 + (i / 20) * 0.8
                }}
              />
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THE BENTO GRID
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-fr" style={{ minHeight: '600px' }}>
          
          {/* 1. THE PULSE (Activity Feed) - Tall Column */}
          <BentoCard 
            title="The Pulse" 
            icon={TrendingUp} 
            className="md:row-span-2 shadow-lg shadow-black/20"
            link="/feed"
          >
            <div className="space-y-6 relative flex-1 pt-2">
              {/* Timeline line */}
              <div className="absolute left-2 top-2 bottom-2 w-px bg-terminal-800" />
              
              {/* Activity items */}
              {[
                { user: 'Alex (DevOps)', action: 'deployed', target: 'production-v4.2.0', time: '2m', type: 'deploy' },
                { user: 'Sarah (CTO)', action: 'approved decision', target: 'DEC-103: Neon DB Migration', time: '15m', type: 'decision' },
                { user: 'You', action: 'updated doc', target: 'Series A Pitch Deck', time: '1h', type: 'doc' },
                { user: 'Mike (Product)', action: 'started workshop', target: 'Q3 Roadmap Planning', time: '2h', type: 'workshop' },
                { user: 'System', action: 'alert', target: 'High latency in US-East', time: '4h', type: 'alert' },
              ].map((item, i) => (
                <div key={i} className="relative pl-8 group/item">
                  <div className={cn(
                    "absolute left-0.5 top-1.5 w-3 h-3 rounded-full border-2 z-10 transition-transform group-hover/item:scale-110",
                    item.type === 'alert' ? "bg-error border-error" :
                    item.type === 'deploy' ? "bg-success border-success" :
                    "bg-terminal-950 border-terminal-600"
                  )} />
                  <p className="text-sm text-terminal-300 leading-snug">
                    <span className="font-semibold text-terminal-100">{item.user}</span>{' '}
                    <span className="text-terminal-500">{item.action}</span>{' '}
                    <br/>
                    <span className={cn(
                      "font-mono text-xs hover:underline cursor-pointer",
                      item.type === 'alert' ? "text-error" : "text-accent"
                    )}>{item.target}</span>
                  </p>
                  <span className="text-[10px] text-terminal-600 font-mono mt-0.5 block">{item.time} ago</span>
                </div>
              ))}
            </div>

            {/* Broadcast input */}
            <div className="mt-auto pt-4 border-t border-terminal-800">
              <input 
                placeholder="Broadcast a status update..."
                className="w-full bg-terminal-900/50 border border-terminal-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent text-terminal-200 placeholder:text-terminal-600 transition-colors"
              />
            </div>
          </BentoCard>

          {/* 2. REVIEW QUEUE (Decisions) - Wide */}
          <BentoCard 
            title="Review Queue" 
            icon={GitPullRequest} 
            className="md:col-span-2 shadow-lg shadow-black/20"
            link="/decisions"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayDecisions.slice(0, 2).map((decision) => (
                <div 
                  key={decision.id} 
                  className={cn(
                    'p-4 rounded-lg bg-terminal-900/50 border border-terminal-700',
                    'hover:border-accent/50 hover:bg-terminal-900 transition-all cursor-pointer group/card'
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded font-bold tracking-wider',
                      decision.status === 'URGENT'
                        ? 'text-warning bg-warning/10 border border-warning/20'
                        : 'text-terminal-400 bg-terminal-800 border border-terminal-700'
                    )}>
                      {decision.status}
                    </span>
                    <span className="text-[10px] text-terminal-500 font-mono">{decision.id}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-terminal-100 leading-tight mb-4 group-hover/card:text-accent transition-colors truncate">
                    {decision.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(decision.votes, 3))].map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full bg-terminal-700 ring-2 ring-terminal-900 flex items-center justify-center text-[8px] font-mono text-terminal-300"
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-terminal-500 font-mono">{decision.votes}/{decision.total} votes</span>
                    </div>
                    <button className="text-xs bg-accent text-terminal-950 px-3 py-1.5 rounded font-bold hover:bg-accent-hover opacity-0 group-hover/card:opacity-100 transition-all transform translate-y-2 group-hover/card:translate-y-0">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* 3. LIVE WORKSHOPS - Box */}
          <BentoCard 
            title="Live Sessions" 
            icon={Clock} 
            className="md:col-span-1 shadow-lg shadow-black/20"
            link="/workshops"
          >
            <div className="h-full flex flex-col justify-center items-center text-center relative overflow-hidden group/workshop">
              {/* Background pulse effect */}
              <div className="absolute inset-0 bg-accent/5 rounded-lg opacity-0 group-hover/workshop:opacity-100 transition-opacity animate-pulse" />

              <div className="relative mb-4">
                <div className="w-3 h-3 bg-error rounded-full animate-ping absolute -top-1 -right-1" />
                <div className="w-16 h-16 bg-terminal-800 rounded-full flex items-center justify-center border-2 border-terminal-700 group-hover/workshop:border-accent transition-colors">
                  <Users className="w-7 h-7 text-terminal-400 group-hover/workshop:text-accent transition-colors" />
                </div>
              </div>
              <h3 className="font-semibold text-base text-terminal-100 mb-1">Q3 Roadmap Planning</h3>
              <p className="text-xs text-terminal-500 mb-5 font-mono">5 participants • 12m elapsed</p>
              <Link 
                to="/workshops/current"
                className="text-xs font-medium bg-terminal-800 hover:bg-accent hover:text-terminal-950 border border-terminal-600 hover:border-accent px-4 py-2 rounded-full transition-all duration-300"
              >
                Join Session
              </Link>
            </div>
          </BentoCard>

          {/* 4. JUMP BACK IN (Recent Docs) - Wide */}
          <BentoCard 
            title="Jump back in" 
            icon={FileText} 
            className="md:col-span-2 shadow-lg shadow-black/20"
            link="/documents"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {displayDocs.slice(0, 4).map((doc, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-3 hover:bg-terminal-800/50 border border-transparent hover:border-terminal-700 rounded-md transition-all cursor-pointer group/item"
                >
                  <div className="p-2 bg-terminal-900 rounded border border-terminal-800 group-hover/item:border-terminal-600 transition-colors">
                    <FileText className="w-4 h-4 text-terminal-500 group-hover/item:text-accent transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-terminal-300 group-hover/item:text-terminal-100 truncate">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-mono bg-terminal-800 text-terminal-400 px-1 rounded">{doc.tag}</span>
                       <span className="text-[10px] text-terminal-600 font-mono">Edited {doc.edited}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* 5. DIRECT MESSAGES (Chat) - Box */}
          <BentoCard 
            title="Messages" 
            icon={MessageSquare} 
            className="md:col-span-1 shadow-lg shadow-black/20"
            link="/messages"
          >
            <div className="space-y-4">
              {displayChats.map((chat, i) => (
                <div key={i} className="flex items-start gap-3 group/msg cursor-pointer">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 bg-terminal-800 rounded-lg flex items-center justify-center text-xs font-mono font-bold text-terminal-300 border border-terminal-700 group-hover/msg:border-accent/50 transition-colors">
                      {chat.name[0]}
                    </div>
                    {chat.online && (
                      <div className="w-2.5 h-2.5 bg-success border-2 border-terminal-950 rounded-full absolute -bottom-1 -right-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-semibold text-terminal-200 group-hover/msg:text-accent transition-colors truncate max-w-[80px]">{chat.name}</span>
                      <span className="text-[10px] text-terminal-600 font-mono">{chat.time}</span>
                    </div>
                    <p className="text-xs text-terminal-400 leading-relaxed line-clamp-2 group-hover/msg:text-terminal-300 transition-colors">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            QUICK STATS BAR
           ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-terminal-800">
          <QuickStat icon={Scale} label="Decisions" value={decisionCount.toString()} change="+3" />
          <QuickStat icon={FileText} label="Documents" value={docCount.toString()} change="+7" />
          <QuickStat icon={Users} label="Workshops" value={workshopCount.toString()} change="+2" />
          <QuickStat icon={Zap} label="Projects" value={projectCount.toString()} />
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BENTO CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface BentoCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
  link?: string;
}

function BentoCard({ title, icon: Icon, className, children, link }: BentoCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-lg p-4 flex flex-col',
      'bg-terminal-900/50 border border-terminal-700',
      'hover:border-terminal-600 transition-colors group',
      className
    )}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3 z-10">
        <div className="flex items-center gap-2 text-terminal-400">
          <Icon className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            {title}
          </span>
        </div>
        {link && (
          <Link 
            to={link} 
            className="opacity-0 group-hover:opacity-100 transition-opacity text-success p-1 hover:bg-success/10 rounded"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>

      {/* Subtle gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   QUICK STAT COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface QuickStatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change?: string;
}

function QuickStat({ icon: Icon, label, value, change }: QuickStatProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-terminal-900/30 border border-terminal-800 rounded-lg">
      <Icon className="w-4 h-4 text-terminal-500" />
      <div className="flex-1">
        <span className="text-[10px] font-mono text-terminal-500 uppercase">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-mono font-semibold text-terminal-200">{value}</span>
          {change && (
            <span className="text-[10px] font-mono text-success">{change} this week</span>
          )}
        </div>
      </div>
    </div>
  );
}
