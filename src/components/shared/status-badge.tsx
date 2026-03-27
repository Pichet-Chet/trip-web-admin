import type { TripStatus, FollowChannel } from "@/types";

const tripStatusConfig: Record<TripStatus, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-(--surface-variant) text-(--on-surface-variant)" },
  draft: { label: "Draft", cls: "bg-purple-100 text-purple-700" },
  unpublished: { label: "Unpublished", cls: "bg-amber-100 text-amber-800" },
};

const channelConfig: Record<FollowChannel, { label: string; icon: string; cls: string }> = {
  line: { label: "LINE", icon: "chat", cls: "bg-green-100 text-green-700" },
  web_push: { label: "Push", icon: "notifications_active", cls: "bg-blue-100 text-blue-700" },
};

interface StatusBadgeProps {
  status: TripStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps): React.ReactNode {
  const c = tripStatusConfig[status];
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${c.cls} ${className}`}>
      {c.label}
    </span>
  );
}

interface ChannelBadgeProps {
  channel: FollowChannel;
  className?: string;
}

export function ChannelBadge({ channel, className = "" }: ChannelBadgeProps): React.ReactNode {
  const c = channelConfig[channel];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.cls} ${className}`}>
      <span className="material-symbols-outlined text-xs">{c.icon}</span>
      {c.label}
    </span>
  );
}
