"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api-client";
import { Bell, BellOff, Check, CheckCheck } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  "application.submitted": { color: "text-cyanAccent", bg: "bg-cyanAccent/10" },
  "application.status_changed": { color: "text-orangeAccent", bg: "bg-orangeAccent/10" },
  "bid.accepted": { color: "text-success", bg: "bg-success/10" },
  "bid.rejected": { color: "text-redAccent", bg: "bg-redAccent/10" },
  "wallet.credited": { color: "text-success", bg: "bg-success/10" },
  "wallet.withdrawal_processing": { color: "text-orangeAccent", bg: "bg-orangeAccent/10" },
};

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const data = await apiGet<Notification[]>("/users/notifications");
      setNotifications(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await apiPatch(`/users/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch {
      // Silently fail
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.read);
    await Promise.allSettled(
      unread.map((n) => apiPatch(`/users/notifications/${n.id}/read`)),
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sectionH2 text-ink">Notifications</h2>
          <p className="mt-1 text-sm text-muted">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-white border border-border p-1">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-brandGreen text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === "unread"
                  ? "bg-brandGreen text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllAsRead()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <BellOff className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">
            {filter === "unread"
              ? "No unread notifications."
              : "No notifications yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? { color: "text-muted", bg: "bg-muted/10" };
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                    n.read ? "bg-white" : "bg-brandGreen/5"
                  } hover:bg-gray-50`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${cfg.bg}`}>
                    {n.read ? (
                      <BellOff className={`h-4 w-4 ${cfg.color}`} />
                    ) : (
                      <Bell className={`h-4 w-4 ${cfg.color}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${n.read ? "text-muted" : "text-ink"}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-brandGreen flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-muted/70 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => void markAsRead(n.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
