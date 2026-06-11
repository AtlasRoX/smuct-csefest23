"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Terminal,
  LayoutDashboard,
  Users,
  Send,
  CreditCard,
  LogOut,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Teams", href: "/teams", icon: Users },
    { label: "Submissions", href: "/submissions", icon: Send },
    { label: "Payments", href: "/payments", icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-neutral-900 border-r border-neutral-800">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-neutral-800 gap-2">
          <Terminal className="h-5 w-5 text-accent" />
          <span className="font-heading font-bold text-sm tracking-wider text-neutral-50">
            PARTICIPANT PORTAL
          </span>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-radius-sm transition-colors font-sans ${
                  isActive
                    ? "bg-primary text-neutral-50"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-accent" : "text-neutral-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout section */}
        <div className="p-4 border-t border-neutral-800">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full gap-3 justify-start px-4 text-neutral-400 hover:text-error hover:bg-error/10"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-900 bg-neutral-950/40 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="md:hidden flex items-center gap-2">
            <Terminal className="h-5 w-5 text-accent" />
            <span className="font-heading font-bold text-sm tracking-wider text-neutral-50">
              CSE FEST
            </span>
          </div>
          <div className="hidden md:block" />

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 rounded-full border border-neutral-850 hover:bg-neutral-900 transition-colors text-neutral-400 hover:text-neutral-200"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
              )}
            </button>
          </div>
        </header>

        {/* Inner page view content wrapper */}
        <main className="grow p-6 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800 flex justify-around py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center p-1.5 text-xxs font-sans transition-colors ${
                isActive ? "text-accent font-semibold" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center p-1.5 text-xxs font-sans text-neutral-500 hover:text-error"
        >
          <LogOut className="h-5 w-5 mb-1" />
          <span>Exit</span>
        </button>
      </nav>
    </div>
  );
}
