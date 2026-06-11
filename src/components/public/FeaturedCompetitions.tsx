"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, ArrowRight, Sparkles } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Competition {
  id: string;
  name: string;
  type: string;
  shortDescription: string;
  teamSize: string;
  fee: string;
  eligibility: string;
  prizePool: string;
  coverImageUrl?: string;
}

const COMPETITION_FALLBACK_IMAGES: Record<string, string> = {
  "software-showcase": "https://lh3.googleusercontent.com/aida-public/AB6AXuA_sDktpXuLP2tISJMUZEcQ4oGKbCVVcNP5a4utyyZtBi7Ej5u04f-4z15P1MSAZHG8G8J9yzcTIF94AFSvEBinOXDgHJIpfKIbbfkfS2_u0W5K67FkveR-wyc-XJE8vD1tSGcEBbIGbeq0R6AV1mMs28BeNO-UsyX8SkyjMjJOpiGZ-xlsU_wH-MS-jk_Z1QZCqMbMKyZyxFvICAe7am_VuNLiyEbf-tNGuGlWK3etefYWmooKxmObEtTAvN5Hubc_mi35Al7BYaR0",
  "iot-showcase": "https://lh3.googleusercontent.com/aida-public/AB6AXuDFVUDWSPAEANjIsD2sxQTMsSZSJj4cJAypasue8WYXlBnLth68CUXTAW9au4ZEgd0YnZJe98SL3qfoadNI6H8qz2p79RCO2DMqmKbkkmkU-lOLpu3ptXY9NL7rbI0l2VBvBkcfxxO03eYlgeeEtMtJYeTUx1ylzt11k6XFat5qFOY6YlmWPcfDW0I0o8szghnvKWfSD3DphEy9cR__yalRVd7gpHHK9rg69Re-Er7oNXMSgPC_GNxebMseXt9TiJ3PMLzj2uXx9Tji",
  "idea-showcase": "https://lh3.googleusercontent.com/aida-public/AB6AXuCKGHlmkgO9OUf-RDdwzqJtbmiRD5dk84Y8R5IZD8mghvMKlxjfQayu_ChlNaTxFZTqY9iG1Bl_cKKCYN-YHo4T_y8_ylysu_sgUKIfy6uMPzuEqCK7v9xcs8ShtpUjZXzjWJ3m7PnUdt1GoDjHaXT1Vk2Fh28fgfpENV_PML4DqznU68jk7VTa5R_6PYyGxM-rIseMyI4hWN-y0ngIhMMTI0UUIi-9LBCHA1NYQX4i-OEPf7MIwGpMN2mgAfro5D3uIUSgd33mKpMp",
};

export function FeaturedCompetitions() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const { data, error, isLoading } = useSWR<{ success: boolean; data: Competition[] }>(
    mounted ? "/api/public/competitions" : null,
    fetcher
  );

  const competitions = React.useMemo(() => (data?.success ? data.data : []), [data]);

  if (!mounted || isLoading) {
    return (
      <section id="competitions" className="max-w-[1280px] mx-auto px-4 md:px-16 py-10 border-t border-neutral-850">
        <div className="text-center mb-16">
          <div className="h-4 bg-neutral-900 w-24 mx-auto rounded mb-3 animate-pulse" />
          <div className="h-8 bg-neutral-900 w-64 mx-auto rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-neutral-900/40 border border-neutral-850 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error || competitions.length === 0) {
    return (
      <section id="competitions" className="max-w-[1280px] mx-auto px-4 md:px-16 py-10 border-t border-neutral-850">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-[2px] w-8 bg-primary" />
            <span className="font-sans text-xs font-bold text-primary tracking-widest uppercase">
              Competitions Arena
            </span>
            <div className="h-[2px] w-8 bg-primary" />
          </div>
          <h2 className="font-heading text-4xl font-extrabold text-neutral-100">Featured Challenges</h2>
        </div>
        <div className="py-16 text-center rounded-xl border border-dashed border-neutral-850 bg-neutral-900/10 max-w-xl mx-auto flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-neutral-300">Challenges Loading Soon</h3>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans max-w-sm leading-relaxed">
            The organizer has not published any active competitions yet. Check back shortly to register!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="competitions" className="max-w-[1280px] mx-auto px-4 md:px-16 py-10 border-t border-neutral-850 relative">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-[2px] w-8 bg-primary" />
          <span className="font-sans text-xs font-bold text-primary tracking-widest uppercase">
            Competitions Arena
          </span>
          <div className="h-[2px] w-8 bg-primary" />
        </div>
        <h2 className="font-heading text-4xl md:text-5xl font-black text-neutral-100 tracking-tight">
          Featured Challenges
        </h2>
        <p className="text-neutral-400 font-sans text-sm max-w-lg mx-auto mt-2.5">
          Browse the active showcases and tournaments. Command the stage and show your mastery.
        </p>
      </div>

      {/* Grid of Competitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {competitions.slice(0, 3).map((comp) => {
          const coverImage =
            comp.coverImageUrl ||
            COMPETITION_FALLBACK_IMAGES[comp.id] ||
            "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600";

          return (
            <div
              key={comp.id}
              className="relative bg-neutral-900/40 rounded-xl flex flex-col group border border-neutral-850 transition-all duration-normal hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] overflow-hidden"
            >
              {/* Cover image header */}
              <div className="relative h-36 overflow-hidden rounded-t-xl">
                <div className="absolute inset-0 bg-linear-to-t from-neutral-950/90 to-transparent z-10" />
                <Image
                  src={coverImage}
                  alt={comp.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 380px"
                />
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-primary/20 backdrop-blur-md border border-primary/40 text-primary px-3 py-1 rounded-full text-[10px] font-bold font-sans">
                    {comp.teamSize.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-heading font-extrabold text-xl text-neutral-100 group-hover:text-neutral-50 transition-colors">
                      {comp.name}
                    </h3>
                    <Badge variant="accent" className="text-[9px] font-mono shrink-0 uppercase">
                      {comp.eligibility}
                    </Badge>
                  </div>
                  <p className="text-neutral-400 text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed font-sans">
                    {comp.shortDescription}
                  </p>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex justify-between items-center py-3 border-y border-neutral-850/60">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase font-sans">Prize Pool</span>
                    <span className="font-mono text-secondary text-sm font-extrabold">{comp.prizePool}</span>
                  </div>
                  <div className="flex gap-3">
                    <Link href="/register" className="grow">
                      <Button className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 h-auto rounded-lg text-xs font-bold font-sans">
                        Register
                      </Button>
                    </Link>
                    <Link href={`/competitions/${comp.id}`}>
                      <Button
                        variant="secondary"
                        className="px-3 border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200 py-2.5 h-auto rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explore All Button */}
      {competitions.length > 0 && (
        <div className="flex justify-center mt-12 relative z-10">
          <Link href="/competitions">
            <Button variant="secondary" className="gap-2 border border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 px-6 py-3 h-auto">
              <span>View All Competitions</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}
