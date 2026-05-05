"use client";

import type { FollowChannel } from "@/types";

const channelConfig: Record<FollowChannel, { label: string; icon: string; cls: string }> = {
  line: { label: "LINE", icon: "chat", cls: "bg-green-100 text-green-700" },
  web_push: { label: "Push", icon: "notifications_active", cls: "bg-blue-100 text-blue-700" },
};

interface ChannelBadgeProps {
  channel: FollowChannel;
  className?: string;
}

export function ChannelBadge({ channel, className = "" }: ChannelBadgeProps): React.ReactNode {
  const c = channelConfig[channel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.cls} ${className}`}>
      <span aria-hidden="true" className="material-symbols-outlined text-xs">{c.icon}</span>
      {c.label}
    </span>
  );
}
