"use client";

import * as React from "react";
import Link from "next/link";
import { Terminal, Menu, X, LayoutDashboard, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

import { User } from "@supabase/supabase-js";

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const supabase = createClient();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const navLinks = [
    { label: "Competitions", href: "#competitions" },
    { label: "Timeline", href: "#timeline" },
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Terminal className="h-6 w-6 text-accent group-hover:rotate-12 transition-transform duration-150" />
            <span className="font-heading font-bold text-lg tracking-wider text-neutral-50 bg-linear-to-r from-neutral-50 via-neutral-100 to-neutral-400 bg-clip-text">
              CSE FEST '26
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="relative text-sm text-neutral-400 hover:text-neutral-50 transition-colors duration-150 py-1 font-sans font-medium group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-normal" />
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="secondary" className="gap-2">
                  <LayoutDashboard className="h-4 w-4 text-accent" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="primary" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-50 focus:outline-none cursor-pointer"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-neutral-400 hover:text-neutral-50 py-2 font-sans"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-neutral-800">
            {user ? (
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                <Button variant="secondary" className="w-full gap-2">
                  <LayoutDashboard className="h-4 w-4 text-accent" />
                  <span>Dashboard</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
