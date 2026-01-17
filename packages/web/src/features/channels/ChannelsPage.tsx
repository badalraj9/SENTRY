'use client';

import { Outlet, useParams } from 'react-router-dom';
import { ChannelSidebar } from '../../widgets/sidebar';
import { ActivityFeed } from '../feed';

/* ═══════════════════════════════════════════════════════════════════════════
   Channels Page Layout
   Combines Channel Sidebar with channel content
   ═══════════════════════════════════════════════════════════════════════════ */

export function ChannelsPage() {
  const { channelId } = useParams<{ channelId: string }>();

  return (
    <div className="h-full flex">
      {/* Channel Sidebar */}
      <ChannelSidebar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {channelId ? (
          <Outlet />
        ) : (
          // Default: Show Activity Feed when no channel selected
          <ActivityFeed />
        )}
      </div>
    </div>
  );
}

export default ChannelsPage;
