"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Send,
  CreditCard,
  LogOut,
  Sun,
  Moon,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NotificationPanel } from "@/components/shared/NotificationPanel";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [, setUnreadCount] = React.useState(0);
  const [userProfile, setUserProfile] = React.useState<{ full_name: string; email: string } | null>(null);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const supabase = createClient();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      const activeTheme = isDark ? "dark" : "light";
      const saved = localStorage.getItem("smuct-portal-sidebar-collapsed");
      const frameId = requestAnimationFrame(() => {
        setTheme(activeTheme);
        if (saved === "true") {
          setIsCollapsed(true);
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, []);

  React.useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, profile_complete")
          .eq("id", user.id)
          .single();

        // Redirect to profile setup if profile is not complete (skip if already there)
        if (!profile?.profile_complete && !pathname.startsWith("/profile-setup")) {
          router.replace("/profile-setup");
          return;
        }

        setUserProfile({
          full_name: profile?.full_name || "Participant",
          email: user.email || "",
        });
      }
    }
    loadUser();
  }, [supabase, pathname, router]);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("smuct-portal-sidebar-collapsed", String(nextState));
  };

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
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="font-sans bg-background text-foreground min-h-screen flex w-full overflow-x-hidden relative">
      {/* Background ambient glowing orbs (extremely low opacity to match target style depth) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/2 dark:bg-primary/8 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-secondary/2 dark:bg-secondary/6 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-300 z-20 ${
          isCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {/* Brand */}
        <div
          className={`flex h-16 items-center border-b border-sidebar-border gap-3 transition-all duration-300 ${
            isCollapsed ? "justify-center" : "px-6 justify-between"
          }`}
        >
          {!isCollapsed ? (
            <>
              <div className="relative h-[30px] w-[105px] flex items-center">
                <Image
                  src="/logo of smuct and cse fest combined light.png"
                  alt="SMUCT CSE Fest '26 Logo"
                  width={105}
                  height={30}
                  className="h-7.5 w-auto object-contain dark:hidden"
                />
                <Image
                  src="/logo of smuct and cse fest combined (for dark mode).png"
                  alt="SMUCT CSE Fest '26 Dark Logo"
                  width={105}
                  height={30}
                  className="h-7.5 w-auto object-contain hidden dark:block"
                />
              </div>
              <span className="font-heading font-bold text-[10px] tracking-widest text-primary border-l border-sidebar-border pl-3">
                PORTAL
              </span>
            </>
          ) : (
            <span
              className="font-heading font-bold text-sm text-primary tracking-wider font-mono bg-background px-2 py-1 rounded-sm border border-sidebar-border"
              title="SMUCT CSE Fest '26"
            >
              CF
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-fast ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-sidebar-foreground"}`} />
                {!isCollapsed && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-2 py-2 border-t border-sidebar-border">
          <button
            onClick={toggleSidebar}
            className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer ${
              isCollapsed ? "justify-center px-0" : ""
            }`}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Card / User Section */}
        <div className="p-4 border-t border-sidebar-border">
          {isCollapsed ? (
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-sidebar-foreground mx-auto"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 shrink-0 hover:text-error" />
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  {userProfile?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "PA"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-sidebar-foreground truncate" title={userProfile?.full_name}>
                    {userProfile?.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate" title={userProfile?.email}>
                    {userProfile?.email}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full gap-2 justify-start h-8 px-2 text-xs text-sidebar-foreground hover:text-error hover:bg-error/10 hover:border-transparent rounded border-transparent"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen pb-20 md:pb-0 transition-all duration-300 z-10 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8 z-30 sticky top-0">
          {/* Mobile brand */}
          <div className="md:hidden flex items-center gap-3">
            <div className="relative h-[30px] w-[105px]">
              <Image
                src="/logo of smuct and cse fest combined light.png"
                alt="SMUCT CSE Fest '26 Logo"
                width={105}
                height={30}
                className="h-7.5 w-auto object-contain dark:hidden"
              />
              <Image
                src="/logo of smuct and cse fest combined (for dark mode).png"
                alt="SMUCT CSE Fest '26 Dark Logo"
                width={105}
                height={30}
                className="h-7.5 w-auto object-contain hidden dark:block"
              />
            </div>
            <span className="font-heading font-bold text-xs tracking-widest text-primary border-l border-border pl-3">
              PORTAL
            </span>
          </div>
          <div className="hidden md:block" />

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-muted text-sidebar-foreground border-transparent cursor-pointer animate-fade-in"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5" />
              )}
            </button>
            <NotificationPanel onUnreadCountChange={setUnreadCount} />
          </div>
        </header>

        {/* Page content */}
        <main className="grow p-8 max-w-5xl w-full mx-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation (matching CRM layout) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border flex justify-around py-2 safe-area-pb shadow-sm">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center p-1.5 gap-0.5 text-[10px] font-sans transition-all ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-sidebar-foreground hover:text-primary"
              }`}
            >
              <div className={`p-1 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-primary" : ""}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center p-1.5 gap-0.5 text-[10px] font-sans text-sidebar-foreground hover:text-error transition-colors"
        >
          <div className="p-1 rounded-md">
            <LogOut className="h-5 w-5" />
          </div>
          <span>Exit</span>
        </button>
      </nav>
    </div>
  );
}
