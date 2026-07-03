"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LayoutDashboard } from "lucide-react";

type NavEntry = {
  label: string;
  href: string;
  /** If set, the link only shows for these roles. Omit = show for everyone. */
  roles?: string[];
};

const navItems: NavEntry[] = [
  { label: "Find Jobs", href: "/jobs" },
  { label: "Freelance", href: "/freelance" },
  { label: "Post Gig", href: "/freelance/post", roles: ["EMPLOYER", "ADMIN"] },
  { label: "My Bids", href: "/freelance/my-bids", roles: ["FREELANCER"] },
  { label: "About Us", href: "/about" },
  { label: "CV Maker", href: "/cv-maker" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

function getProfileHref(role: string): string {
  switch (role) {
    case "EMPLOYER":
      return "/dashboard/employer/profile";
    case "FREELANCER":
      return "/dashboard/freelancer/profile";
    case "JOB_SEEKER":
      return "/dashboard/seeker/profile";
    case "ADMIN":
      return "/dashboard/admin";
    default:
      return "/dashboard/freelancer/profile";
  }
}

function getDashboardHref(role: string): string {
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

export default function Header() {
  const router = useRouter();
  const { status, user, signOut } = useAuth();

  const visibleNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="container-page flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-primary">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brandGreen text-white text-sm">
            B
          </span>
          <span>
            Beleqet <span className="text-brandGreen">Job</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink">
          {visibleNav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brandGreen transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {status === "authenticated" && user ? (
            <>
              <Link
                href={getProfileHref(user.role)}
                className="hidden sm:block text-sm font-semibold text-ink hover:text-brandGreen transition-colors"
              >
                {user.firstName}
              </Link>

              <Link
                href={getDashboardHref(user.role)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:border-brandGreen hover:text-brandGreen transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-ink hover:text-brandGreen transition-colors"
            >
              Login / Sign Up
            </Link>
          )}

          {(user?.role === "EMPLOYER" || user?.role === "ADMIN" || !user) && (
            <Link
              href="/post-job"
              className="inline-flex items-center rounded-full bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
            >
              Post a Job
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
