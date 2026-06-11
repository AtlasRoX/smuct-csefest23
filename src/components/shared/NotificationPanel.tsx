"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  CheckCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  action_url: string | null;
  created_at: string;
}

interface NotificationPanelProps {
  onUnreadCountChange?: (count: number) => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    iconClass: "text-success",
    borderClass: "border-l-success",
    bgClass: "bg-success/5",
  },
  error: {
    icon: XCircle,
    iconClass: "text-error",
    borderClass: "border-l-error",
    bgClass: "bg-error/5",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-warning",
    borderClass: "border-l-warning",
    bgClass: "bg-warning/5",
  },
  info: {
    icon: Info,
    iconClass: "text-accent",
    borderClass: "border-l-accent",
    bgClass: "bg-accent/5",
  },
};

export function NotificationPanel({ onUnreadCountChange }: NotificationPanelProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Fetch notifications from the API
  const fetchNotifications = React.useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data ?? []);
        const count = data.unread_count ?? 0;
        setUnreadCount(count);
        onUnreadCountChange?.(count);
      }
    } catch {
      // Silently fail on background polls
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [onUnreadCountChange]);

  // Initial load + polling every 30s
  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    const interval = setInterval(() => fetchNotifications(true), 30_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Close panel when clicking outside
  React.useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}`, { method: "PATCH" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        onUnreadCountChange?.(Math.max(0, unreadCount - 1));
      } catch {
        // ignore
      }
    }

    // Navigate if action_url exists
    if (notification.action_url) {
      setIsOpen(false);
      router.push(notification.action_url);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full border border-neutral-850 hover:bg-neutral-900 transition-colors text-neutral-400 hover:text-neutral-200"
        aria-label={`View notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <>
            {/* Animated ping */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-accent animate-ping opacity-75" />
            {/* Static badge */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-accent flex items-center justify-center">
              {unreadCount > 9 && (
                <span className="text-[6px] font-bold text-white leading-none">9+</span>
              )}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 top-[calc(100%+10px)] w-[360px] max-h-[480px] z-50 flex flex-col rounded-md border border-neutral-800 bg-neutral-950/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden"
          style={{
            animation: "slideDownFade 180ms ease-out forwards",
          }}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-accent" />
              <span className="text-sm font-heading font-semibold text-neutral-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-xxs font-sans font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="flex items-center gap-1 text-xxs text-neutral-400 hover:text-accent transition-colors disabled:opacity-50 px-2 py-1 rounded-sm hover:bg-neutral-900 font-sans"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-neutral-900">
            {loading ? (
              // Skeleton loader
              <div className="p-3 space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-neutral-800 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-3 bg-neutral-800 rounded w-3/4" />
                      <div className="h-2.5 bg-neutral-900 rounded w-full" />
                      <div className="h-2 bg-neutral-900 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
                <div className="p-4 rounded-full bg-neutral-900 border border-neutral-800">
                  <Bell className="h-6 w-6 text-neutral-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-heading font-semibold text-neutral-400">
                    You&apos;re all caught up
                  </p>
                  <p className="text-xs text-neutral-600 font-sans">
                    Notifications about your verification, teams, and submissions will appear here.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type] ?? typeConfig.info;
                const Icon = config.icon;
                const isUnread = !notification.read;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3.5 flex gap-3 transition-colors border-l-2 ${
                      isUnread
                        ? `${config.borderClass} ${config.bgClass} hover:bg-neutral-900/50`
                        : "border-l-transparent hover:bg-neutral-900/30"
                    }`}
                  >
                    {/* Type Icon */}
                    <div className="shrink-0 mt-0.5">
                      <Icon className={`h-4.5 w-4.5 ${config.iconClass} ${isUnread ? "" : "opacity-50"}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs font-sans font-semibold leading-snug ${
                            isUnread ? "text-neutral-100" : "text-neutral-400"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-sans leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xxs text-neutral-700 font-sans pt-0.5">
                        {timeAgo(notification.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Slide-down animation keyframe injected inline */}
      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
