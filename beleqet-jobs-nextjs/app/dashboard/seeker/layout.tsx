"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function SeekerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
