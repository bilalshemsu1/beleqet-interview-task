"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Wallet,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Gavel,
} from "lucide-react";

// ── Navigation configs per role ────────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const employerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/employer", icon: LayoutDashboard },
  { label: "My Jobs", href: "/dashboard/employer/jobs", icon: Briefcase },
  { label: "Applications", href: "/dashboard/employer/applications", icon: FileText },
  { label: "Company Profile", href: "/dashboard/employer/profile", icon: Users },
  { label: "Notifications", href: "/dashboard/employer/notifications", icon: Bell },
];

const freelancerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/freelancer", icon: LayoutDashboard },
  { label: "My Bids", href: "/dashboard/freelancer/bids", icon: FileText },
  { label: "Contracts", href: "/dashboard/freelancer/contracts", icon: Briefcase },
  { label: "Wallet", href: "/dashboard/freelancer/wallet", icon: Wallet },
  { label: "Profile", href: "/dashboard/freelancer/profile", icon: Settings },
  { label: "Notifications", href: "/dashboard/freelancer/notifications", icon: Bell },
];

const seekerNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/seeker", icon: LayoutDashboard },
  { label: "My Applications", href: "/dashboard/seeker/applications", icon: FileText },
  { label: "Saved Jobs", href: "/dashboard/seeker/saved", icon: Briefcase },
  { label: "Profile", href: "/dashboard/seeker/profile", icon: Settings },
  { label: "Notifications", href: "/dashboard/seeker/notifications", icon: Bell },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Disputes", href: "/dashboard/admin/disputes", icon: Gavel },
  { label: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
];

function getNavForRole(role: string): NavItem[] {
  switch (role) {
    case "EMPLOYER":
      return employerNav;
    case "FREELANCER":
      return freelancerNav;
    case "JOB_SEEKER":
      return seekerNav;
    case "ADMIN":
      return adminNav;
    default:
      return [];
  }
}

function getDashboardHome(role: string): string {
  switch (role) {
    case "EMPLOYER":
      return "/dashboard/employer";
    case "FREELANCER":
      return "/dashboard/freelancer";
    case "JOB_SEEKER":
      return "/dashboard/seeker";
    case "ADMIN":
      return "/dashboard/admin";
    default:
      return "/";
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut, isEmployer, isFreelancer, isJobSeeker, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "anonymous" && !pathname.startsWith("/login")) {
      router.push("/login");
    }
  }, [status, router, pathname]);

  // Redirect to own dashboard if accessing wrong role's dashboard
  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    const roleMap: Record<string, string> = {
      EMPLOYER: "/dashboard/employer",
      FREELANCER: "/dashboard/freelancer",
      JOB_SEEKER: "/dashboard/seeker",
      ADMIN: "/dashboard/admin",
    };
    const correctHome = roleMap[user.role];
    if (!correctHome) return;
    if (!pathname.startsWith(correctHome)) {
      router.push(correctHome);
    }
  }, [status, user, router, pathname]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brandGreen border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = getNavForRole(user.role);
  const dashHome = getDashboardHome(user.role);
  const roleLabel = isEmployer
    ? "Employer"
    : isFreelancer
    ? "Freelancer"
    : isAdmin
    ? "Admin"
    : "Job Seeker";

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-pageBg">
      {/* ── Mobile overlay ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-border">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-primary">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brandGreen text-white text-sm">
                B
              </span>
              <span>
                Beleqet <span className="text-brandGreen">Job</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-ink truncate">
              {user.firstName} {user.lastName}
            </p>
            <span className="inline-block mt-1 text-xs font-medium text-brandGreen bg-brandGreen/10 px-2 py-0.5 rounded-full">
              {roleLabel}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === dashHome
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brandGreen/10 text-brandGreen"
                      : "text-muted hover:bg-gray-50 hover:text-ink"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-brandGreen" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Back to site + Logout */}
          <div className="border-t border-border px-3 py-3 space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 hover:text-ink transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-redAccent hover:bg-redAccent/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 flex items-center h-14 bg-white/90 backdrop-blur border-b border-border px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted hover:text-ink mr-3"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold text-ink truncate">
            {navItems.find(
              (item) =>
                item.href === dashHome
                  ? pathname === item.href
                  : pathname.startsWith(item.href),
            )?.label ?? "Dashboard"}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
