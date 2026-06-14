"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Compass, Trophy, ShieldAlert, X } from "lucide-react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface CompItem {
  id: string;
  name: string;
  type: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CommandPalette() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const router = useRouter();

  useBodyScrollLock(isOpen);

  // Load competitions for search
  const { data: compRes } = useSWR<{ success: boolean; data: CompItem[] }>(
    isOpen ? "/api/admin/competitions" : null,
    fetcher
  );

  const competitions = React.useMemo(() => compRes?.data || [], [compRes]);

  // Toggle Command Palette
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearchQuery("");
        setSelectedIndex(0);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Standard Navigation Actions
  const staticActions = React.useMemo(
    () => [
      { label: "Go to Admin Dashboard", href: "/admin/dashboard", category: "Navigation", icon: Compass },
      { label: "Go to Verifications", href: "/admin/verifications", category: "Navigation", icon: ShieldAlert },
      { label: "Go to Competitions Builder", href: "/admin/competitions", category: "Navigation", icon: Trophy },
      { label: "Go to Submissions Review", href: "/admin/submissions", category: "Navigation", icon: Trophy },
      { label: "Go to Payments Queue", href: "/admin/payments", category: "Navigation", icon: Trophy },
      { label: "Go to Judging Ledger", href: "/admin/judging", category: "Navigation", icon: Trophy },
      { label: "Go to CMS Content Settings", href: "/admin/cms", category: "Navigation", icon: Compass },
      { label: "Go to Analytics & Metrics", href: "/admin/analytics", category: "Navigation", icon: Compass },
    ],
    []
  );

  // Dynamic filter lists
  const filteredItems = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    // 1. Filter static actions
    const matchedActions = staticActions
      .filter((action) => action.label.toLowerCase().includes(query))
      .map((action) => ({
        label: action.label,
        href: action.href,
        category: action.category,
        icon: action.icon,
      }));

    // 2. Filter competitions
    const matchedComps = competitions
      .filter((comp) => comp.name.toLowerCase().includes(query))
      .map((comp) => ({
        label: `Jump to Judging: ${comp.name}`,
        href: `/admin/judging?competition_id=${comp.id}`,
        category: "Competitions",
        icon: Trophy,
      }));

    return [...matchedActions, ...matchedComps];
  }, [searchQuery, staticActions, competitions]);

  // Handle keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = filteredItems[selectedIndex];
      if (selectedItem) {
        router.push(selectedItem.href);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-neutral-950/80 backdrop-blur-sm">
      {/* Container Card */}
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-md shadow-level-3 overflow-hidden flex flex-col max-h-[60vh] font-sans">
        
        {/* Input area */}
        <div className="flex items-center px-4 border-b border-neutral-800 gap-2 h-14 shrink-0">
          <Search className="h-5 w-5 text-neutral-500" />
          <input
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-neutral-100 placeholder:text-neutral-500 font-sans"
            placeholder="Type a command or search competitions... (Press Esc to close)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[40vh] divide-y divide-neutral-850">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = item.icon;
                return (
                  <div
                    key={`${item.href}-${idx}`}
                    onClick={() => {
                      router.push(item.href);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded cursor-pointer transition-colors text-xs font-medium ${
                      isSelected
                        ? "bg-accent/10 border-accent/20 text-neutral-100"
                        : "text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-accent" : "text-neutral-500"}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <Badge variant="neutral" className="text-xxs uppercase tracking-wider scale-95 font-semibold font-sans">
                      {item.category}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-500 flex flex-col items-center gap-1">
              <Compass className="h-8 w-8 text-neutral-700 animate-pulse" />
              <span>No results found matching your search.</span>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="h-9 bg-neutral-950 border-t border-neutral-800 px-4 flex items-center justify-between text-xxs text-neutral-500 select-none shrink-0 font-mono">
          <div className="flex gap-2">
            <span>â†‘â†“ to navigate</span>
            <span>â†µ to select</span>
          </div>
          <span>ctrl+k to close</span>
        </div>
      </div>
    </div>
  );
}

