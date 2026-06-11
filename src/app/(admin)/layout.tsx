"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  Trophy,
  Send,
  CreditCard,
  Sliders,
  LogOut,
  Bell,
  Menu,
  X,
  Globe,
  BarChart3,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { CommandPalette } from "@/components/admin/command-palette";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const supabase = createClient();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      const activeTheme = isDark ? "dark" : "light";
      const frameId = requestAnimationFrame(() => {
        setTheme(activeTheme);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, []);

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

  React.useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!userData || userData.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
    }

    checkAdmin();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "ID Verifications", href: "/admin/verifications", icon: UserCheck },
    { label: "Competitions", href: "/admin/competitions", icon: Trophy },
    { label: "Submissions", href: "/admin/submissions", icon: Send },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Judging", href: "/admin/judging", icon: Sliders },
    { label: "CMS Content", href: "/admin/cms", icon: Globe },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ];

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center" suppressHydrationWarning>
        <div className="space-y-4 text-center animate-pulse" suppressHydrationWarning>
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" suppressHydrationWarning />
          <p className="text-sm text-neutral-400 font-mono" suppressHydrationWarning>Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-100">
      <CommandPalette />
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-neutral-900 border-r border-neutral-800">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 border-b border-neutral-800 gap-3">
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
          <span className="font-heading font-bold text-xs tracking-widest text-secondary border-l border-neutral-800 pl-3 animate-pulse">
            ADMIN
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
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors font-sans ${
                  isActive
                    ? "bg-secondary text-neutral-50"
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
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-900 bg-neutral-950/40 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="lg:hidden flex items-center gap-3">
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
            <span className="font-heading font-bold text-xs tracking-widest text-secondary border-l border-neutral-800 pl-3">
              ADMIN
            </span>
          </div>
          <div className="hidden lg:block" />

          {/* Right Header Controls & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="p-2 rounded-full border border-neutral-850 hover:bg-neutral-900 transition-colors text-neutral-400 hover:text-neutral-200 cursor-pointer animate-fade-in"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5" />
              )}
            </Button>
            <button
              className="lg:hidden p-2 rounded-full border border-neutral-850 hover:bg-neutral-900 transition-colors text-neutral-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button
              className="p-2 rounded-full border border-neutral-850 hover:bg-neutral-900 transition-colors text-neutral-400 hover:text-neutral-200"
              aria-label="View system alerts"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Inner page content wrapper */}
        <main className="grow p-6 md:p-8 w-full">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex bg-neutral-950/80 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs bg-neutral-900 border-r border-neutral-800 p-4 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-850">
              <div className="flex items-center gap-3">
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
                <span className="font-heading font-bold text-xs tracking-widest text-secondary border-l border-neutral-800 pl-3">
                  ADMIN
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="grow space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors font-sans ${
                      isActive
                        ? "bg-secondary text-neutral-50"
                        : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-neutral-850">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full gap-3 justify-start px-4 text-neutral-400 hover:text-error hover:bg-error/10"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
