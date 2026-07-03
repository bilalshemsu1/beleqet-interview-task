"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/api-client";
import {
  Users,
  UserCheck,
  UserX,
  Briefcase,
  Gavel,
  Search,
} from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
};

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Admin", color: "text-redAccent", bg: "bg-redAccent/10" },
  EMPLOYER: { label: "Employer", color: "text-purpleAccent", bg: "bg-purpleAccent/10" },
  FREELANCER: { label: "Freelancer", color: "text-cyanAccent", bg: "bg-cyanAccent/10" },
  JOB_SEEKER: { label: "Job Seeker", color: "text-brandGreen", bg: "bg-brandGreen/10" },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white border border-border p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [suspending, setSuspending] = useState<string | null>(null);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await apiGet<AdminUser[]>("/admin/users");
      setUsers(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend(id: string) {
    if (!confirm("Are you sure you want to suspend this user?")) return;
    setSuspending(id);
    try {
      await apiPatch(`/admin/users/${id}/suspend`);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to suspend user");
    } finally {
      setSuspending(null);
    }
  }

  const filtered = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const suspendedUsers = totalUsers - activeUsers;
  const roleCounts: Record<string, number> = {};
  for (const u of users) {
    roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sectionH2 text-ink">Admin Dashboard</h2>
          <p className="mt-1 text-muted">Manage users, disputes, and platform health.</p>
        </div>
        <Link
          href="/dashboard/admin/disputes"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
        >
          <Gavel className="h-4 w-4" />
          Disputes
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={totalUsers} icon={Users} color="bg-brandGreen" />
        <StatCard label="Active Users" value={activeUsers} icon={UserCheck} color="bg-success" />
        <StatCard label="Suspended" value={suspendedUsers} icon={UserX} color="bg-redAccent" />
        <StatCard label="Employers" value={roleCounts["EMPLOYER"] ?? 0} icon={Briefcase} color="bg-purpleAccent" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brandGreen transition-colors"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-white border border-border p-1">
          {(["ALL", "EMPLOYER", "FREELANCER", "JOB_SEEKER", "ADMIN"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                roleFilter === role
                  ? "bg-brandGreen text-white"
                  : "text-muted hover:bg-gray-100"
              }`}
            >
              {role === "ALL" ? "All" : role.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* User table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-border p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-border mb-3" />
          <p className="text-ink font-medium">No users match your filters.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-muted">User</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role] ?? { label: user.role, color: "text-muted", bg: "bg-muted/10" };
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleCfg.bg} ${roleCfg.color}`}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive ? "text-success" : "text-redAccent"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-success" : "bg-redAccent"}`} />
                          {user.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {user.isActive && user.role !== "ADMIN" && (
                          <button
                            onClick={() => void handleSuspend(user.id)}
                            disabled={suspending === user.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-redAccent/30 bg-redAccent/5 px-3 py-1.5 text-xs font-medium text-redAccent hover:bg-redAccent/10 transition-colors disabled:opacity-50"
                          >
                            <UserX className="h-3 w-3" />
                            {suspending === user.id ? "Suspending..." : "Suspend"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
